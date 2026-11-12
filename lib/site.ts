export const SITE_URL = "https://zorenko.github.io";
export const NAME = "Anastasia Zorenko";
export const EMAIL = "zorenkoa@gmail.com";
export const LINKEDIN = "https://www.linkedin.com/in/anastasiazorenko/";
export const GITHUB = "https://github.com/zorenko";
export const OG_IMAGE = "/assets/img/work/celsia-slide-01.jpg";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toDate = (iso: string) => new Date(`${iso}T12:00:00`);
/** "9 Nov 2026" */
export const formatDate = (iso: string) => {
  const d = toDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
/** "Nov 2026" */
export const formatMonth = (iso: string) => {
  const d = toDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** Title, description and Open Graph tags for a page. Titles get " | Anastasia Zorenko" from the root layout. */
export const pageMeta = (title: string, description: string, image = OG_IMAGE) => ({
  title,
  description,
  openGraph: { title: `${title} | ${NAME}`, description, images: image },
});
