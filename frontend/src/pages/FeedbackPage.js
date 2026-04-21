import Header from "../components/Header";
import Feedback from "../components/Feedback";
import "../styles/PageWrapper.css";

export default function FeedbackPage() {
  return (
    <div className="page-wrapper">
      <Header />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
        <Feedback />
      </div>
    </div>
  );
}
