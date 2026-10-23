import { useRouteParams } from "@/lib/route-params";
import { RegistrationBoard } from "@/features/management-session/RegistrationBoard";

export default function Page() {
  const { id } = useRouteParams<"id">();

  return (
    <div className="flex justify-center p-8">
      <RegistrationBoard id={id} />
    </div>
  );
}
