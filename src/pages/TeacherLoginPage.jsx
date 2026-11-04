import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function TeacherLoginPage() {
  return (
    <AuthLayout
      role="teacher"
      headline="Build Your Next Research Team."
      description="Connect with talented students, publish research opportunities, and turn innovative ideas into meaningful discoveries."
      benefits={[
        'Discover students across universities.',
        'Publish research and project opportunities.',
        'Review applicants and build research teams.'
      ]}
    >
      <LoginForm
        role="teacher"
        heading="Teacher / Researcher Login"
        subtitle="Sign in to manage your academic collaborations."
        emailLabel="Institutional Email Address"
        emailPlaceholder="name@university.edu"
        buttonText="Sign In to Dashboard"
        infoBannerText="Teacher accounts require academic identity verification before publishing opportunities."
        securityNote="Institutional verification ensures trusted academic research."
      />
    </AuthLayout>
  );
}
