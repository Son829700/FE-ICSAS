// src/pages/AuthPages/TwoStepVerification.tsx
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import TwoStepVerificationForm from "../../components/auth/TwoStepVerificationForm";

export default function TwoStepVerification() {
  return (
    <>
      <PageMeta
        title="Two Step Verification | ICSAS"
        description="Verify your identity to continue"
      />
      <AuthLayout>
        <TwoStepVerificationForm />
      </AuthLayout>
    </>
  );
}