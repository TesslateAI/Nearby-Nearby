import { hasVal } from './poiDetailUtils';
import ContentGroup from './ContentGroup';

export default function InfoPair({ title, value }) {
  if (!hasVal(value)) return null;
  return (
    <ContentGroup title={title}>
      <div className="acc_content_text">
        <p>{typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : value}</p>
      </div>
    </ContentGroup>
  );
}
