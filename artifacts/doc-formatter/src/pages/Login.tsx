import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Loader2, LockKeyhole, LogOut, Mail, ShieldCheck, Sparkles, X } from "lucide-react";

import { requestFormatterAccess, signInToFormatter, type FormatterUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LoginPageProps {
    onSignedIn: (user: FormatterUser) => void;
    currentUser?: FormatterUser | null;
    onLogout?: () => void;
}

export default function LoginPage({ onSignedIn, currentUser, onLogout }: LoginPageProps) {
    const [email, setEmail] = useState(currentUser?.email || "");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestName, setRequestName] = useState(currentUser?.name || "");
    const [requestEmail, setRequestEmail] = useState(currentUser?.email || "");
    const [organization, setOrganization] = useState("");
    const [reason, setReason] = useState("");
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [requestSuccess, setRequestSuccess] = useState("");

    const isAccessRestricted = Boolean(currentUser && currentUser.document_formatter_access === false);

    useEffect(() => {
        if (currentUser?.email) {
            setEmail(currentUser.email);
            setRequestEmail(currentUser.email);
        }

        if (currentUser?.name) {
            setRequestName(currentUser.name);
        }
    }, [currentUser]);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Email and password are required.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const user = await signInToFormatter(email, password);
            onSignedIn(user);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to sign in right now.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!requestName.trim() || !requestEmail.trim() || !reason.trim()) {
            setRequestError("Name, email, and access reason are required.");
            return;
        }

        setRequestSubmitting(true);
        setRequestError("");
        setRequestSuccess("");

        try {
            await requestFormatterAccess({
                name: requestName,
                email: requestEmail,
                organization,
                reason,
            });

            setRequestSuccess("Your access request was sent successfully. Please check your email for confirmation.");
            setReason("");
            setOrganization("");
            setRequestDialogOpen(false);
        } catch (err) {
            console.error(err);
            setRequestError(err instanceof Error ? err.message : "Unable to submit the access request right now.");
        } finally {
            setRequestSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Felix Platform Document Formatter</CardTitle>
                        <CardDescription className="mt-1">
                            Access is limited to Felix Platform admins and approved paid users.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isAccessRestricted ? (
                        <>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                <div className="flex items-start gap-2">
                                    <LockKeyhole className="w-4 h-4 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Access pending approval</p>
                                        <p className="mt-1">
                                            Signed in as <strong>{currentUser?.email}</strong>, but this account does not have active formatter access yet.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button className="flex-1" onClick={() => setRequestDialogOpen(true)}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Request access
                                </Button>
                                {onLogout ? (
                                    <Button type="button" variant="outline" className="flex-1" onClick={onLogout}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Use another account
                                    </Button>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === "Enter") {
                                            void handleSubmit();
                                        }
                                    }}
                                />
                            </div>

                            <Button className="w-full" onClick={() => void handleSubmit()} disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Continue to Formatter
                                    </>
                                )}
                            </Button>

                            <Button type="button" variant="outline" className="w-full" onClick={() => setRequestDialogOpen(true)}>
                                <Mail className="w-4 h-4 mr-2" />
                                Request access
                            </Button>
                        </>
                    )}

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    {requestSuccess ? <p className="text-sm text-emerald-700">{requestSuccess}</p> : null}
                </CardContent>
            </Card>

            {requestDialogOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
                    <Card className="w-full max-w-lg border-slate-200 shadow-2xl">
                        <CardHeader className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle>Request Document Formatter access</CardTitle>
                                    <CardDescription className="mt-1">
                                        Tell the Felix Platform team who you are and how you plan to use the formatter.
                                    </CardDescription>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setRequestDialogOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="request-name">Name</Label>
                                <Input
                                    id="request-name"
                                    value={requestName}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => setRequestName(event.target.value)}
                                    placeholder="Your full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="request-email">Email</Label>
                                <Input
                                    id="request-email"
                                    type="email"
                                    value={requestEmail}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => setRequestEmail(event.target.value)}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="request-organization">Organization or team (optional)</Label>
                                <Input
                                    id="request-organization"
                                    value={organization}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => setOrganization(event.target.value)}
                                    placeholder="Business, school, department, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="request-reason">Why do you need access?</Label>
                                <Textarea
                                    id="request-reason"
                                    value={reason}
                                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)}
                                    placeholder="Describe your use case, team need, or subscription request."
                                    rows={5}
                                />
                            </div>

                            {requestError ? <p className="text-sm text-red-600">{requestError}</p> : null}

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" onClick={() => setRequestDialogOpen(false)} disabled={requestSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={() => void handleRequestAccess()} disabled={requestSubmitting}>
                                    {requestSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send request'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : null}
        </div>
    );
}
