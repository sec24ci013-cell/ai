import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserCheck, FolderKanban, Loader2, AlertCircle } from "lucide-react";
import { getUsers, listCases, updateUserRole, updateCase, UserOut, CaseOut } from "@/lib/api";

export const Route = createFileRoute("/supervisor")({
  component: SupervisorPage,
});

function SupervisorPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: users, isLoading: loadingUsers, error: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    retry: false,
  });

  const { data: cases, isLoading: loadingCases } = useQuery({
    queryKey: ["cases"],
    queryFn: listCases,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => setError(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: ({ caseId, assigneeId }: { caseId: string; assigneeId: string }) => 
      updateCase(caseId, { assignee_id: assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (err: any) => setError(err.message),
  });

  if (usersError) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have the required clearance to view this page. Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="h-10 w-10 rounded-lg glass grid place-items-center bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supervisor Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage investigators and assign cases.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investigator Management */}
        <div className="glass-strong rounded-xl border border-border/60 p-5 flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Investigator Roles</h2>
          </div>
          
          <div className="flex-1 overflow-auto pr-2">
            {loadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-3">
                {users?.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <select
                      className="bg-background border border-border rounded text-xs p-1.5 focus:ring-1 focus:ring-primary"
                      value={user.role}
                      onChange={(e) => roleMutation.mutate({ userId: user.id, role: e.target.value })}
                      disabled={roleMutation.isPending}
                    >
                      <option value="officer">Officer</option>
                      <option value="investigator">Investigator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Case Assignment */}
        <div className="glass-strong rounded-xl border border-border/60 p-5 flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Case Assignments</h2>
          </div>

          <div className="flex-1 overflow-auto pr-2">
            {loadingCases || loadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-3">
                {cases?.map(c => (
                  <div key={c.id} className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/30 border border-border/40">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.crime_type}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === 'open' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">Assigned to:</span>
                      <select
                        className="bg-background border border-border rounded text-xs p-1.5 focus:ring-1 focus:ring-primary flex-1"
                        value={c.assignee_id || ""}
                        onChange={(e) => assignMutation.mutate({ caseId: c.id, assigneeId: e.target.value })}
                        disabled={assignMutation.isPending}
                      >
                        <option value="">-- Unassigned --</option>
                        {users?.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
