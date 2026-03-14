export default function ProfileCard({ profile }) {
  const {
    name,
    avatar,
    position,
    current_company,
    current_company_name,
    about,
    city,
    country_code,
    connections,
    followers,
    education,
    url,
  } = profile

  const company = current_company_name ?? current_company
  const educationList = Array.isArray(education) ? education : []
  const hasEducation = educationList.length > 0
  const experienceList = Array.isArray(profile.experiences) ? profile.experiences : []
  const hasExperience = experienceList.length > 0

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {avatar && (
          <img
            src={avatar}
            alt={name ? `${name} profile` : 'Profile'}
            className="h-24 w-24 shrink-0 rounded-full object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          {name && (
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
          )}
          {(position || company) && (
            <p className="mt-1 text-slate-600">
              {[position, company].filter(Boolean).join(' at ')}
            </p>
          )}
          {(city || country_code) && (
            <p className="mt-1 text-sm text-slate-500">
              {[city, country_code].filter(Boolean).join(', ')}
            </p>
          )}
          {(connections != null || followers != null) && (
            <p className="mt-1 text-sm text-slate-500">
              {[connections != null && `${connections} connections`, followers != null && `${followers} followers`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              View on LinkedIn
            </a>
          )}
        </div>
      </div>

      {about && (
        <section className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            About
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">{about}</p>
        </section>
      )}

      {hasEducation && (
        <section className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Education
          </h3>
          <ul className="mt-2 space-y-3">
            {educationList.map((item, i) => (
              <li key={item.school ?? i} className="text-slate-700">
                <div>
                  {item.school && <span className="font-medium">{item.school}</span>}
                  {item.degree && <span className="text-slate-600"> · {item.degree}</span>}
                  {item.field_of_study && <span className="text-slate-600">, {item.field_of_study}</span>}
                  {item.dates && <span className="block text-sm text-slate-500">{item.dates}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasExperience && (
        <section className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Experience
          </h3>
          <ul className="mt-2 space-y-3">
            {experienceList.map((item, i) => (
              <li key={i} className="text-slate-700">
                <div>
                  {item.title && <span className="font-medium">{item.title}</span>}
                  {item.company && <span className="text-slate-600"> at {item.company}</span>}
                  {item.dates && <span className="block text-sm text-slate-500">{item.dates}</span>}
                  {item.description && (
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!name && !position && !company && !about && !hasEducation && !hasExperience && (
        <pre className="mt-4 overflow-auto rounded border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
    </article>
  )
}
