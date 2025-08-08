import * as k8s from '@kubernetes/client-node';
import https from 'https';
import fs from 'fs';

let k8sApi: k8s.BatchV1Api | null = null;
let coreV1Api: k8s.CoreV1Api | null = null;
let kc: k8s.KubeConfig | null = null;

export function getK8sConfig() {
  if (!kc) {
    kc = new k8s.KubeConfig();
    
    try {
      // In GKE, this will automatically use the in-cluster config
      if (process.env.KUBERNETES_SERVICE_HOST) {
        console.log('Loading in-cluster Kubernetes config');
        kc.loadFromCluster();
      } else {
        // For local development, load from default kubeconfig
        console.log('Loading default Kubernetes config');
        kc.loadFromDefault();
      }
    } catch (error) {
      console.error('Failed to initialize Kubernetes config:', error);
      throw error;
    }
  }
  
  return kc;
}

export function getK8sClient() {
  if (!k8sApi) {
    const config = getK8sConfig();
    k8sApi = config.makeApiClient(k8s.BatchV1Api);
  }
  
  return k8sApi;
}

export function getCoreV1Client() {
  if (!coreV1Api) {
    const config = getK8sConfig();
    coreV1Api = config.makeApiClient(k8s.CoreV1Api);
  }
  return coreV1Api;
}

// Direct REST API approach for creating jobs
async function createJobViaREST(namespace: string, job: k8s.V1Job): Promise<k8s.V1Job> {
  return new Promise((resolve, reject) => {
    const kc = getK8sConfig();
    const cluster = kc.getCurrentCluster();
    const user = kc.getCurrentUser();
    
    if (!cluster || !user) {
      reject(new Error('Failed to get cluster or user config'));
      return;
    }
    
    // Get the server URL and remove trailing slash
    const server = cluster.server.replace(/\/$/, '');
    const token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8');
    
    const options = {
      hostname: server.replace(/^https?:\/\//, '').split(':')[0],
      port: 443,
      path: `/apis/batch/v1/namespaces/${namespace}/jobs`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      rejectUnauthorized: false // For self-signed certificates in GKE
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to create job: ${res.statusCode} ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(job));
    req.end();
  });
}

export async function checkKubernetesVersion() {
  try {
    const config = getK8sConfig();
    const versionApi = config.makeApiClient(k8s.VersionApi);
    const versionInfo = await versionApi.getCode();
    console.log('Kubernetes version:', versionInfo.body);
    return versionInfo.body;
  } catch (error) {
    console.error('Failed to get Kubernetes version:', error);
    throw error;
  }
}

async function ensureNamespaceExists(namespace: string) {
  const coreApi = getCoreV1Client();
  
  try {
    await coreApi.readNamespace(namespace);
    console.log(`Namespace ${namespace} exists`);
  } catch (error: any) {
    if (error.response?.statusCode === 404) {
      console.log(`Namespace ${namespace} not found, creating it...`);
      const namespaceObject: k8s.V1Namespace = {
        metadata: {
          name: namespace
        }
      };
      
      try {
        await coreApi.createNamespace(namespaceObject);
        console.log(`Namespace ${namespace} created successfully`);
      } catch (createError) {
        console.error(`Failed to create namespace ${namespace}:`, createError);
        throw createError;
      }
    } else {
      console.error(`Error checking namespace ${namespace}:`, error);
      throw error;
    }
  }
}

export async function createAgentJob(containerId: string, projectId: string, jwtToken: string) {
  const namespace = 'tandembrain';
  // Kubernetes names must be lowercase and RFC 1123 compliant
  const sanitizedId = containerId.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
  const jobName = `agent-${sanitizedId}`;
  
  console.log('Creating job:', jobName, 'in namespace:', namespace);
  
  const job: k8s.V1Job = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName,
      namespace: namespace,
      labels: {
        app: 'tandembrain-agent',
        projectId: projectId.replace(/[^a-zA-Z0-9-_.]/g, '').replace(/^[-_.]+|[-_.]+$/g, ''),
        containerId: sanitizedId
      }
    },
    spec: {
      template: {
        metadata: {
          labels: {
            app: 'tandembrain-agent',
            projectId: projectId.replace(/[^a-zA-Z0-9-_.]/g, '').replace(/^[-_.]+|[-_.]+$/g, ''),
            containerId: sanitizedId
          }
        },
        spec: {
          serviceAccountName: 'tandembrain-agent',
          restartPolicy: 'Never',
          containers: [{
            name: 'agent',
            image: 'us-west2-docker.pkg.dev/neuronotify/tandembrain/tandembrain-agent:latest',
            env: [
              { name: 'JWT_TOKEN', value: jwtToken },
              { name: 'API_BASE_URL', value: 'http://tandembrain-app.tandembrain.svc.cluster.local' },
              { name: 'PROJECT_ID', value: projectId },
              { name: 'CONTAINER_ID', value: containerId }
            ],
            resources: {
              requests: {
                memory: '512Mi',
                cpu: '250m'
              },
              limits: {
                memory: '2Gi',
                cpu: '1000m'
              }
            }
          }]
        }
      }
    }
  };
  
  // Validate job specification
  console.log('Job specification:', JSON.stringify(job, null, 2));
  
  try {
    // First try the REST API approach
    console.log('Attempting to create job via REST API...');
    const response = await createJobViaREST(namespace, job);
    console.log('Job created successfully via REST:', response.metadata?.name);
    return response;
  } catch (restError: any) {
    console.error('REST API failed:', restError.message);
    
    // Fall back to client library
    const api = getK8sClient();
    try {
      const response = await api.createNamespacedJob(namespace, job);
      console.log('Job created successfully via client library:', response.body.metadata?.name);
      return response.body;
    } catch (clientError: any) {
      console.error('Client library also failed:', clientError.message);
      console.error('Error details:', clientError.response?.body || clientError.message);
      throw clientError;
    }
  }
}

export async function deleteAgentJob(containerId: string) {
  const api = getK8sClient();
  const namespace = 'tandembrain';
  const jobName = `agent-${containerId}`;
  
  try {
    await api.deleteNamespacedJob(
      jobName,
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'Background',
      { propagationPolicy: 'Background' } as any
    );
  } catch (error) {
    console.error('Failed to delete Kubernetes job:', error);
    throw error;
  }
}

export async function getAgentLogs(containerId: string): Promise<string> {
  const api = getCoreV1Client();
  const namespace = 'tandembrain';
  // Sanitize the container ID the same way as in createAgentJob
  const sanitizedId = containerId.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
  const labelSelector = `job-name=agent-${sanitizedId}`;
  
  try {
    // First, find the pod created by this job
    const podsResponse = await api.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      labelSelector
    );
    
    if (podsResponse.body.items.length === 0) {
      throw new Error('No pods found for this container');
    }
    
    // Get the first pod (there should only be one)
    const pod = podsResponse.body.items[0];
    const podName = pod.metadata!.name!;
    
    // Get logs from the pod
    const logsResponse = await api.readNamespacedPodLog(
      podName,
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );
    
    return logsResponse.body;
  } catch (error) {
    console.error('Failed to fetch container logs:', error);
    throw error;
  }
}