import QRCode from "qrcode";

// A QR code for the booking reference, drawn as plain SVG on the server.
//
// Building the shapes here, rather than asking the library for an SVG string,
// means nothing is injected with innerHTML and no JavaScript reaches the
// browser. It also works under the site's Content Security Policy, which a
// QR image loaded from another website would not.
//
// The code holds only the reference, the same text printed under it, so
// scanning it reveals nothing the patient is not already showing.
export default function CheckInQr({
  reference,
  size = 176,
}: {
  reference: string;
  size?: number;
}) {
  const { modules } = QRCode.create(reference, { errorCorrectionLevel: "M" });

  // A quiet zone of four modules on every side, which scanners rely on to find
  // the edges of the code.
  const quiet = 4;
  const total = modules.size + quiet * 2;

  // One path for every dark module, rather than hundreds of separate elements.
  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
    }
  }

  return (
    <svg
      role="img"
      aria-label={`Check-in QR code for booking ${reference}`}
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      // Keeps the squares sharp at any size instead of blurring the edges.
      shapeRendering="crispEdges"
      className="bg-white"
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
