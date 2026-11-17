import { OrgLogo } from "@/components/ui/display";

const logo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#1f6feb"/><path d="M8 28 20 8l12 20z" fill="#fff"/></svg>');

export const meta = { title: "With an image and name beside it", description: "The logo image has empty alt text, so show the name in text." };

export default function WithImage() {
  return (
    <>
      <div className="flex items-center gap-3">
        <OrgLogo name="Peak Makers" src={logo} size="lg" />
        <span className="text-label">Peak Makers</span>
      </div>
      <div className="flex items-center gap-3">
        <OrgLogo name="Night Owls" size="lg" />
        <span className="text-label">Night Owls</span>
      </div>
    </>
  );
}
