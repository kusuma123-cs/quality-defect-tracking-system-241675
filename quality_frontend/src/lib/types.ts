export type Severity = "Low" | "Medium" | "High" | "Critical";
export type DefectStatus = "Open" | "In Progress" | "Complete";
export type ActionStatus = "Open" | "Done";

export type CorrectiveAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string; // ISO date (YYYY-MM-DD)
  status: ActionStatus;
  createdAt: string; // ISO datetime
};

export type Defect = {
  id: string;
  partNumber: string;
  defectType: string;
  quantity: number;
  line: string;
  shift: "A" | "B" | "C";
  severity: Severity;
  occurredAt: string; // ISO date (YYYY-MM-DD)
  status: DefectStatus;
  assignedTo: string;
  rootCause: string; // required before status can become Complete
  notes: string;
  imageBase64?: string; // optional data URL
  actions: CorrectiveAction[];
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

export type AnalyticsSummary = {
  totalDefects: number;
  openDefects: number;
  overdueActions: number;
};
