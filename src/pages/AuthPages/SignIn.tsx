import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title=" SignIn ICSAS |"
        description="Internal Web Portal for Customer Analytics and Business Intelligence Dashboards"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
