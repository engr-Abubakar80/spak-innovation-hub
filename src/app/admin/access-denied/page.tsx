import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-xl font-semibold text-red-700">Access Denied</h1>
        <p className="mt-2 text-sm text-red-600">You do not have permission to access the admin area. Only Super Admins can access this section.</p>
        <div className="mt-4">
          <Link href="/dashboard" className="rounded-lg bg-brand-700 px-4 py-2 text-sm text-white hover:bg-brand-800">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
