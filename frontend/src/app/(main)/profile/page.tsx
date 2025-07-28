import { createClient } from "@/utils/supabase/server";

const ProfilePage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-3">
      <h3>Profile Page</h3>
      <p>
        <strong>Name:</strong> {user?.user_metadata?.name || 'Not provided'}
      </p>

      <p>
        <strong>Email:</strong> {user?.email}
      </p>
    </div>
  );
};

export default ProfilePage;
