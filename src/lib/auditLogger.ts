import { ref, push, set, serverTimestamp } from "firebase/database";
import { logDb } from "./firebase";

export interface AuditLog {
  timestamp: any;
  userEmail: string;
  action: string;
  details: string;
  module: string;
  oldData?: any;
  newData?: any;
}

export const logAction = async (
  userEmail: string, 
  action: string, 
  details: string, 
  module: string,
  oldData?: any,
  newData?: any
) => {
  try {
    const logsRef = ref(logDb, 'audit_logs');
    const newLogRef = push(logsRef);
    await set(newLogRef, {
      timestamp: serverTimestamp(),
      userEmail,
      action,
      details,
      module,
      oldData: oldData ? JSON.stringify(oldData) : null,
      newData: newData ? JSON.stringify(newData) : null
    });
  } catch (error) {
    console.error("Error saving audit log:", error);
  }
};
