import { logoutAction } from "@/app/(auth)/login/actions";
import Button from "@/components/Button";

// A real form, so logging out is a POST. A GET link would let another site
// log you out just by embedding an image pointing at the URL.
export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm">
        Log out
      </Button>
    </form>
  );
}
