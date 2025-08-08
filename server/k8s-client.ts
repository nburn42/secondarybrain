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

export async function getContainerLiveStatus(containerId: string): Promise<{
  status: 'running' | 'completed' | 'failed' | 'pending' | 'paused' | 'not_found';
  podPhase?: string;
  exitCode?: number;
  reason?: string;
}> {
  const api = getCoreV1Client();
  const batchApi = getK8sClient();
  const sanitizedId = containerId.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
  const jobName = `agent-${sanitizedId}`;
  
  try {
    // First check if the job exists
    const jobResponse: any = await batchApi.readNamespacedJob({
      name: jobName,
      namespace: 'tandembrain'
    } as any);
    
    const job = jobResponse.body || jobResponse;
    
    // Check if job is suspended (paused)
    if (job.spec?.suspend === true) {
      return { status: 'paused' };
    }
    
    // Check job status
    if (job.status?.succeeded > 0) {
      return { status: 'completed', exitCode: 0 };
    }
    
    if (job.status?.failed > 0) {
      return { status: 'failed', exitCode: 1 };
    }
    
    // Check pod status for more details
    const podsResponse: any = await api.listNamespacedPod({
      namespace: 'tandembrain',
      labelSelector: `job-name=${jobName}`
    } as any);
    
    const pods = podsResponse.body?.items || podsResponse.items || [];
    
    if (pods.length === 0) {
      return { status: 'pending', reason: 'No pods created yet' };
    }
    
    const pod = pods[0];
    const podPhase = pod.status?.phase;
    
    if (podPhase === 'Running') {
      return { status: 'running', podPhase };
    } else if (podPhase === 'Succeeded') {
      const containerStatus = pod.status?.containerStatuses?.[0];
      const exitCode = containerStatus?.state?.terminated?.exitCode || 0;
      return { status: 'completed', podPhase, exitCode };
    } else if (podPhase === 'Failed') {
      const containerStatus = pod.status?.containerStatuses?.[0];
      const exitCode = containerStatus?.state?.terminated?.exitCode || 1;
      const reason = containerStatus?.state?.terminated?.reason || 'Unknown error';
      return { status: 'failed', podPhase, exitCode, reason };
    } else if (podPhase === 'Pending') {
      return { status: 'pending', podPhase };
    }
    
    return { status: 'pending', podPhase };
  } catch (error: any) {
    if (error.response?.statusCode === 404) {
      return { status: 'not_found' };
    }
    console.error('Failed to get container live status:', error);
    throw error;
  }
}

export async function pauseContainer(containerId: string): Promise<void> {
  const api = getK8sClient();
  const sanitizedId = containerId.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
  const jobName = `agent-${sanitizedId}`;
  
  try {
    // Suspend the job (pause it)
    await api.patchNamespacedJob({
      name: jobName,
      namespace: 'tandembrain',
      body: {
        spec: {
          suspend: true
        }
      }
    } as any);
  } catch (error) {
    console.error('Failed to pause container:', error);
    throw error;
  }
}

export async function resumeContainer(containerId: string): Promise<void> {
  const api = getK8sClient();
  const sanitizedId = containerId.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
  const jobName = `agent-${sanitizedId}`;
  
  try {
    // Resume the job (unpause it)
    await api.patchNamespacedJob({
      name: jobName,
      namespace: 'tandembrain',
      body: {
        spec: {
          suspend: false
        }
      }
    } as any);
  } catch (error) {
    console.error('Failed to resume container:', error);
    throw error;
  }
}

export async function getAgentLogs(containerId: string): Promise<string> {
  const api = getCoreV1Client();
  // Sanitize the container ID the same way as in createAgentJob
  const sanitizedId = containerId.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').replace(/--+/g, '-');
  const podNamePrefix = `agent-${sanitizedId}`;
  
  try {
    // List pods with the job label
    const podsResponse: any = await api.listNamespacedPod({
      namespace: 'tandembrain',
      labelSelector: `job-name=${podNamePrefix}`
    } as any);
    
    // Check if response has body.items or direct items
    const pods = podsResponse.body?.items || podsResponse.items || [];
    
    if (pods.length === 0) {
      // Fallback: try to find by name prefix
      const allPodsResponse: any = await api.listNamespacedPod({
        namespace: 'tandembrain'
      } as any);
      
      const allPods = allPodsResponse.body?.items || allPodsResponse.items || [];
      const matchingPods = allPods.filter((pod: any) => 
        pod.metadata?.name?.startsWith(podNamePrefix)
      );
      
      if (matchingPods.length === 0) {
        throw new Error('No pods found for this container');
      }
      
      const podName = matchingPods[0].metadata!.name!;
      const logsResponse: any = await api.readNamespacedPodLog({
        name: podName,
        namespace: 'tandembrain'
      } as any);
      
      // Logs might be in body or directly in response
      return logsResponse.body || logsResponse;
    }
    
    // Get the first pod (there should only be one)
    const pod = pods[0];
    const podName = pod.metadata!.name!;
    
    // Get logs from the pod
    const logsResponse: any = await api.readNamespacedPodLog({
      name: podName,
      namespace: 'tandembrain'
    } as any);
    
    // Logs might be in body or directly in response
    return logsResponse.body || logsResponse;
  } catch (error) {
    console.error('Failed to fetch container logs:', error);
    throw error;
  }
}