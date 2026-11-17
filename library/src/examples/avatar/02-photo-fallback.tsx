import { Avatar, initials } from "@/components/ui/display";

const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f5b83d"/><circle cx="20" cy="16" r="7" fill="#fff"/><rect x="8" y="26" width="24" height="14" rx="7" fill="#fff"/></svg>');

export const meta = { title: "Photo and fallbacks", description: "A broken or missing image falls back to initials. initials() is also exported." };

export default function PhotoFallback() {
  return (
    <>
      <Avatar name="Photo person" src={photo} size="lg" />
      <Avatar name="Broken Image" src="https://invalid.example/missing.png" size="lg" />
      <Avatar name={null} size="lg" />
      <span className="text-body-ui text-ink-secondary">
        initials("Mary Jane Watson") = {initials("Mary Jane Watson")}, initials("", "--") = {initials("", "--")}
      </span>
    </>
  );
}
