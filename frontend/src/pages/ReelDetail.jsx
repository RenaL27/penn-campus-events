import { useParams, Link } from "react-router-dom";
import Layout from "../components/discovery/Layout";
import Reels from "../components/discovery/Reels";
export default function ReelDetail() {
  const { id } = useParams();
  return (
    <Layout>
      <div className="page-intro">
        <p className="eyebrow">CAMPUS IN MOTION</p>
        <h1>A little closer to the action.</h1>
        <Link className="text-link" to="/?tab=reels">
          ← Back to Reels
        </Link>
      </div>
      <Reels reelId={id} />
    </Layout>
  );
}
