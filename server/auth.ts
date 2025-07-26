import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'neural-notify-secret-key';

export interface AgentTokenPayload {
  project_id: string;
  task_id?: string;
  iat: number;
  exp: number;
}

export function generateAgentToken(projectId: string, taskId?: string): string {
  const payload: AgentTokenPayload = {
    project_id: projectId,
    task_id: taskId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  return jwt.sign(payload, JWT_SECRET);
}

export function verifyAgentToken(token: string): AgentTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AgentTokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}