/**
 * Announce box — rendered verbatim from nn-templates/home-page-01.html.
 * Styling lives in src/styles/nn/stylez.css (#announce_box).
 */
export default function AnnouncementBanner() {
  return (
    <div id="announce_box">
      <div className="wrapper_default">
        <strong><span style={{ color: '#562556' }}>Testing in Progress:</span></strong>{' '}
        Currently, Nearby Nearby is available only in select areas of Pittsboro, NC. We are starting small to ensure we get it right.
      </div>
    </div>
  );
}
