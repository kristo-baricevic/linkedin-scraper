export default function ProfileCard({ profile }) {
  const { name, headline, location, about, profileImageBase64, experience, education } = profile || {};
  const experienceList = Array.isArray(experience) ? experience : [];
  const educationList = Array.isArray(education) ? education : [];
  const hasExperience = experienceList.length > 0;
  const hasEducation = educationList.length > 0;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {profileImageBase64 && (
          <img
            src={profileImageBase64}
            alt={name ? `${name} profile` : "Profile"}
            className="h-24 w-24 shrink-0 rounded-full object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          {name && <h2 className="text-xl font-semibold text-slate-900">{name}</h2>}
          {headline && <p className="mt-1 text-slate-600">{headline}</p>}
          {location && <p className="mt-1 text-sm text-slate-500">{location}</p>}
        </div>
      </div>

      {about && (
        <section className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">About</h3>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">{about}</p>
        </section>
      )}

      {hasExperience && (
        <section className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Experience</h3>
          <ul className="mt-2 space-y-3">
            {experienceList.map((item, i) => (
              <li key={i} className="text-slate-700">
                <div>
                  {item.title && <span className="font-medium">{item.title}</span>}
                  {item.company && <span className="text-slate-600"> at {item.company}</span>}
                  {item.dates && <span className="block text-sm text-slate-500">{item.dates}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasEducation && (
        <section className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Education</h3>
          <ul className="mt-2 space-y-3">
            {educationList.map((item, i) => (
              <li key={i} className="text-slate-700">
                <div>
                  {(item.title || item.school) && <span className="font-medium">{item.title || item.school}</span>}
                  {item.company && <span className="text-slate-600"> · {item.company}</span>}
                  {item.dates && <span className="block text-sm text-slate-500">{item.dates}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!name && !headline && !about && !hasExperience && !hasEducation && (
        <pre className="mt-4 overflow-auto rounded border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
    </article>
  );
}
