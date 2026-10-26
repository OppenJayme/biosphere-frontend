import { ExhibitStatePage } from "@/components/exhibits/public/ExhibitStatePage";

// One message for missing, unpublished, disabled, archived, and retired-URL exhibits; the backend
// returns the same 404 for all of them, so nothing about the earlier content is revealed
// (REQ-4.12-09, BR-20). The page's generateMetadata titles it "Exhibit unavailable", and Next adds
// noindex to 404 responses.
export default function ExhibitUnavailable() {
  return (
    <ExhibitStatePage heading="This exhibit is unavailable">
      <p>The exhibit for this QR code or link is not on display right now.</p>
      <p>Please ask museum staff for help, or explore other specimens in our Gallery.</p>
    </ExhibitStatePage>
  );
}
