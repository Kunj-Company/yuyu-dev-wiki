import { useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";

export const meta = { title: "Groups and controlled value", layout: "stack" };

export default function Groups() {
  const [value, setValue] = useState("");

  return (
    <div className="w-full max-w-sm">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Event format">
          <SelectValue placeholder="Event format" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>In person</SelectLabel>
            <SelectItem value="meetup">Meetup</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Online</SelectLabel>
            <SelectItem value="webinar">Webinar</SelectItem>
            <SelectItem value="call" disabled>Group call (coming soon)</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
