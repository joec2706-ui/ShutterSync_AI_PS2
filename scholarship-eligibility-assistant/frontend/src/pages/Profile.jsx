import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CATEGORIES, COURSE_LEVELS, DISABILITY, GENDERS, STATES } from '../utils/constants';
import { emptyProfile, toPayload, validateForm } from '../utils/profile';
import { DEMO_PROFILES } from '../utils/demoProfiles';
import DocumentUploader from '../components/DocumentUploader';
import ConflictBanner from '../components/ConflictBanner';
import { ErrorBox } from '../components/Feedback';
import Disclaimer from '../components/Disclaimer';

function Field({ id, label, optional, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label text-xs">
        {label}{optional && <span className="optional">(optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
      {error && <p id={`${id}-err`} className="field-error text-xs" role="alert">{error}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <fieldset className="card p-5 space-y-3">
      <legend className="px-1 text-sm font-bold uppercase tracking-wider text-navy-900">{title}</legend>
      {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
      {children}
    </fieldset>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { profile, setProfile, setResults, addWalletDocument } = useApp();
  const [interviewMode, setInterviewMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // For Smart Interview Wizard
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (name) => (e) => {
    setProfile((p) => ({ ...p, [name]: e.target.value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }));
  };
  const ic = (name) => `input text-xs ${errors[name] ? 'input-error' : ''}`;
  const a11y = (name) => ({
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-err` : undefined
  });

  function applyExtracted(x) {
    setProfile((p) => ({
      ...p,
      annualIncome: x.extractedIncome != null ? String(x.extractedIncome) : p.annualIncome,
      domicileState: x.state && !p.domicileState && (x.documentType === 'Domicile Certificate' || x.documentType === 'domicileCertificate') ? x.state : p.domicileState
    }));
    // Also save to wallet
    addWalletDocument({
      id: 'doc_' + Date.now(),
      documentType: x.documentType,
      label: x.label || x.documentType,
      fileName: x.fileName || 'Uploaded Document',
      uploadedAt: new Date().toISOString(),
      extracted: x.extracted || {},
      verified: Boolean(x.textExtracted)
    });
  }

  async function onSubmit(e) {
    if (e) e.preventDefault();
    setApiError(null);
    const v = validateForm(profile);
    setErrors(v);
    if (Object.keys(v).length) {
      document.getElementById(Object.keys(v)[0])?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const data = await api.evaluateAll(toPayload(profile));
      setResults(data);
      navigate('/results');
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const loadDemo = (d) => {
    setProfile({ ...d.profile });
    setErrors({});
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const interviewSteps = [
    { title: 'Personal & State Details', subtitle: 'Basic background to check geographical and reservation quotas.' },
    { title: 'Academic & Enrollment', subtitle: 'Your course level, course name, and year of study.' },
    { title: 'Financial & Documents', subtitle: 'Household income and held certificates.' }
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Student Profile &amp; Eligibility Setup</h1>
          <p className="mt-1 text-xs text-slate-600">
            Fields marked optional can be left blank. Omitted fields are treated as unknown, not as failures.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInterviewMode(false)}
            className={`rounded-md px-3 py-1.5 transition-all ${
              !interviewMode ? 'bg-white text-navy-900 shadow-2xs' : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            📋 Full Form
          </button>
          <button
            type="button"
            onClick={() => setInterviewMode(true)}
            className={`rounded-md px-3 py-1.5 transition-all ${
              interviewMode ? 'bg-white text-navy-900 shadow-2xs' : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            🧭 Smart Interview Wizard
          </button>
        </div>
      </div>

      <ConflictBanner />

      {/* Demo Profiles Card */}
      <section className="card p-4 bg-slate-50/60 border-slate-200" aria-label="Demo profiles">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700">⚡ 1-Click Demo Profiles</p>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {DEMO_PROFILES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => loadDemo(d)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-navy-400 hover:bg-navy-50/50 shadow-2xs transition-all"
            >
              <span className="block text-xs font-bold text-navy-900">{d.title}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">{d.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      {/* SMART INTERVIEW WIZARD MODE */}
      {interviewMode ? (
        <div className="space-y-5">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-semibold">
            <span className="text-slate-500">Step {currentStep + 1} of {interviewSteps.length}: <strong className="text-navy-900">{interviewSteps[currentStep].title}</strong></span>
            <div className="flex gap-1">
              {interviewSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${i <= currentStep ? 'bg-navy-800' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>

          {currentStep === 0 && (
            <Section title="Personal & Residence" subtitle="Required for state scholarships and reservation schemes.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="fullName" label="Full name" optional>
                  <input id="fullName" className="input text-xs" value={profile.fullName} onChange={set('fullName')} maxLength={100} placeholder="e.g. Aarav Sharma" />
                </Field>
                <Field id="age" label="Age" optional error={errors.age}>
                  <input id="age" inputMode="numeric" className={ic('age')} value={profile.age} onChange={set('age')} {...a11y('age')} placeholder="e.g. 20" />
                </Field>
                <Field id="stateOfResidence" label="State of residence" error={errors.stateOfResidence}>
                  <select id="stateOfResidence" className={ic('stateOfResidence')} value={profile.stateOfResidence} onChange={set('stateOfResidence')} {...a11y('stateOfResidence')}>
                    <option value="">Select state…</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field id="domicileState" label="Domicile state" optional hint="State on your domicile certificate.">
                  <select id="domicileState" className="input text-xs" value={profile.domicileState} onChange={set('domicileState')}>
                    <option value="">Not sure / not specified</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field id="category" label="Category" error={errors.category}>
                  <select id="category" className={ic('category')} value={profile.category} onChange={set('category')} {...a11y('category')}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field id="gender" label="Gender" optional error={errors.gender} hint="Needed for gender-specific grants.">
                  <select id="gender" className={ic('gender')} value={profile.gender} onChange={set('gender')}>
                    <option value="">Not specified</option>
                    {GENDERS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field id="disability" label="Disability status (PwD)" optional error={errors.disability}>
                  <select id="disability" className={ic('disability')} value={profile.disability} onChange={set('disability')}>
                    <option value="">Not specified</option>
                    {DISABILITY.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
              </div>
            </Section>
          )}

          {currentStep === 1 && (
            <Section title="Academic Details" subtitle="Required for course and education level matching.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="course" label="Course" error={errors.course}>
                  <input id="course" className={ic('course')} value={profile.course} onChange={set('course')} {...a11y('course')} placeholder="e.g. B.E. Computer Engineering" maxLength={120} />
                </Field>
                <Field id="courseLevel" label="Course level" error={errors.courseLevel}>
                  <select id="courseLevel" className={ic('courseLevel')} value={profile.courseLevel} onChange={set('courseLevel')} {...a11y('courseLevel')}>
                    <option value="">Select level…</option>
                    {COURSE_LEVELS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field id="yearOfStudy" label="Year of study" error={errors.yearOfStudy}>
                  <input id="yearOfStudy" inputMode="numeric" className={ic('yearOfStudy')} value={profile.yearOfStudy} onChange={set('yearOfStudy')} {...a11y('yearOfStudy')} placeholder="e.g. 3" />
                </Field>
                <Field id="institution" label="College / Institution" optional>
                  <input id="institution" className="input text-xs" value={profile.institution} onChange={set('institution')} maxLength={150} placeholder="e.g. State Engineering College" />
                </Field>
              </div>
            </Section>
          )}

          {currentStep === 2 && (
            <>
              <Section title="Family Income">
                <Field id="annualIncome" label="Annual family income (₹)" optional error={errors.annualIncome} hint="Income-based schemes require this to verify limits.">
                  <input id="annualIncome" inputMode="numeric" className={ic('annualIncome')} value={profile.annualIncome} onChange={set('annualIncome')} {...a11y('annualIncome')} placeholder="e.g. 200000" />
                </Field>
              </Section>
              <Section title="Certificates &amp; Evidence" subtitle="Tick what you hold or upload to automatically extract verified data.">
                <DocumentUploader documents={profile.documents || {}} onChange={(documents) => setProfile((p) => ({ ...p, documents }))} onApplyExtracted={applyExtracted} />
              </Section>
            </>
          )}

          {/* Wizard Step Navigation */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              className="btn-ghost text-xs disabled:opacity-30"
            >
              ← Previous Step
            </button>
            {currentStep < interviewSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="btn-primary text-xs font-semibold py-2 px-5"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={onSubmit}
                className="btn-primary text-xs font-bold py-2.5 px-6"
              >
                {submitting ? 'Checking Eligibility with AI…' : 'Finish & Evaluate All Schemes'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* STANDARD FULL FORM MODE */
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Section title="Personal details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" optional>
                <input id="fullName" className="input text-xs" value={profile.fullName} onChange={set('fullName')} maxLength={100} autoComplete="name" placeholder="e.g. Aarav Sharma" />
              </Field>
              <Field id="age" label="Age" optional error={errors.age}>
                <input id="age" inputMode="numeric" className={ic('age')} value={profile.age} onChange={set('age')} {...a11y('age')} placeholder="e.g. 20" />
              </Field>
              <Field id="stateOfResidence" label="State of residence" error={errors.stateOfResidence}>
                <select id="stateOfResidence" className={ic('stateOfResidence')} value={profile.stateOfResidence} onChange={set('stateOfResidence')} {...a11y('stateOfResidence')}>
                  <option value="">Select state…</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field id="domicileState" label="Domicile state" optional hint="State on your domicile certificate. Leave blank if unsure.">
                <select id="domicileState" className="input text-xs" value={profile.domicileState} onChange={set('domicileState')}>
                  <option value="">Not sure / not specified</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field id="category" label="Category" error={errors.category}>
                <select id="category" className={ic('category')} value={profile.category} onChange={set('category')} {...a11y('category')}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field id="gender" label="Gender" optional error={errors.gender} hint="Only needed for gender-specific schemes.">
                <select id="gender" className={ic('gender')} value={profile.gender} onChange={set('gender')}>
                  <option value="">Not specified</option>
                  {GENDERS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field id="disability" label="Disability status" optional error={errors.disability}>
                <select id="disability" className={ic('disability')} value={profile.disability} onChange={set('disability')}>
                  <option value="">Not specified</option>
                  {DISABILITY.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Education">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="course" label="Course" error={errors.course}>
                <input id="course" className={ic('course')} value={profile.course} onChange={set('course')} {...a11y('course')} placeholder="e.g. B.E. Computer Engineering" maxLength={120} />
              </Field>
              <Field id="courseLevel" label="Course level" error={errors.courseLevel}>
                <select id="courseLevel" className={ic('courseLevel')} value={profile.courseLevel} onChange={set('courseLevel')} {...a11y('courseLevel')}>
                  <option value="">Select level…</option>
                  {COURSE_LEVELS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field id="yearOfStudy" label="Year of study" error={errors.yearOfStudy}>
                <input id="yearOfStudy" inputMode="numeric" className={ic('yearOfStudy')} value={profile.yearOfStudy} onChange={set('yearOfStudy')} {...a11y('yearOfStudy')} placeholder="e.g. 3" />
              </Field>
              <Field id="institution" label="College / Institution" optional>
                <input id="institution" className="input text-xs" value={profile.institution} onChange={set('institution')} maxLength={150} placeholder="e.g. Government College of Engineering" />
              </Field>
            </div>
          </Section>

          <Section title="Family income">
            <Field id="annualIncome" label="Annual family income (₹)" optional error={errors.annualIncome} hint="If left blank, income-based rules will show as NEEDS MORE INFORMATION.">
              <input id="annualIncome" inputMode="numeric" className={ic('annualIncome')} value={profile.annualIncome} onChange={set('annualIncome')} {...a11y('annualIncome')} placeholder="e.g. 200000" />
            </Field>
          </Section>

          <Section title="Documents you have" subtitle="Tick what you already hold. Uploading a PDF, TXT or image extracts verified income &amp; residence into your Evidence Wallet.">
            <DocumentUploader documents={profile.documents || {}} onChange={(documents) => setProfile((p) => ({ ...p, documents }))} onApplyExtracted={applyExtracted} />
          </Section>

          <Section title="Anything else?">
            <Field id="additionalInfo" label="Additional information" optional>
              <textarea id="additionalInfo" rows={3} maxLength={500} className="input text-xs" value={profile.additionalInfo} onChange={set('additionalInfo')} placeholder="Any specific background details..." />
            </Field>
          </Section>

          {Object.keys(errors).length > 0 && <ErrorBox title="Please fix highlighted fields" message="Some required fields are missing or invalid." />}
          {apiError && <ErrorBox title="Could not check eligibility" message={apiError} />}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
            <button type="submit" className="btn-primary px-6 py-3 text-sm font-bold shadow-md" disabled={submitting}>
              {submitting ? 'Checking eligibility with AI…' : 'Check Eligibility Across All Schemes'}
            </button>
            <button type="button" className="btn-ghost text-xs" onClick={() => { setProfile({ ...emptyProfile }); setErrors({}); setApiError(null); }}>
              Clear form
            </button>
            {submitting && <span role="status" className="text-xs text-slate-600 animate-pulse">Evaluating rules with AI &amp; deterministic verification...</span>}
          </div>
        </form>
      )}

      <Disclaimer />
    </div>
  );
}
