import React, { useEffect, useState } from "react";
import "./styles.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://pwkqtiuqxlhxcrjmrmhe.supabase.co",
  "sb_publishable_2fEX9SGp-_TI3H4mgiEivw_99BW4uqf"
);

export default function App() {
  const [rsvpCount, setRsvpCount] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [attendees, setAttendees] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [guessName, setGuessName] = useState("");
  const [guessDate, setGuessDate] = useState("");
  const [guessWeight, setGuessWeight] = useState("");

  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchRSVPs();
    fetchGuesses();
    fetchPhotos();
  }, []);

  async function fetchRSVPs() {
    const { data } = await supabase.from("rsvps").select("*");
    if (data) {
      setRsvpCount(data.length);
      setAttendees(data);
    }
  }

  async function fetchGuesses() {
    const { data } = await supabase.from("baby_pool").select("*");
    if (data) setGuesses(data);
  }

  async function fetchPhotos() {
    const { data } = supabase.storage.from("photos").getPublicUrl("");
    const { data: list } = await supabase.storage.from("photos").list();
    if (list) {
      const urls = list.map(
        (file) =>
          `https://pwkqtiuqxlhxcrjmrmhe.supabase.co/storage/v1/object/public/photos/${file.name}`
      );
      setPhotos(urls);
    }
  }

  async function submitRSVP() {
    if (!name) return alert("Enter your name");

    await supabase.from("rsvps").insert([{ name, email }]);
    setName("");
    setEmail("");
    fetchRSVPs();
  }

  async function submitGuess() {
    if (!guessName || !guessDate) return alert("Fill out required fields");

    await supabase
      .from("baby_pool")
      .insert([{ name: guessName, date: guessDate, weight: guessWeight }]);

    setGuessName("");
    setGuessDate("");
    setGuessWeight("");
    fetchGuesses();
  }

  async function uploadPhoto() {
    if (!file) return alert("Pick a file");

    const fileName = `${Date.now()}-${file.name}`;

    await supabase.storage.from("photos").upload(fileName, file);
    setFile(null);
    fetchPhotos();
  }

  return (
    <div className="container">
      <div className="card">
        <div className="badge">Hosted for Baby Perez</div>

        <h1 className="headline">BABY PEREZ DIAPER PARTY</h1>

        <p className="subhead">Bring a pack of diapers • 🍻 Keg Provided</p>

        <p className="description">
          Come hang out, bring diapers, enjoy drinks on us, and help us
          celebrate Baby Perez before the little one arrives.
          <br />
          <br />
          🌮 Walking tacos will be served!
        </p>

        <div className="details-grid">
          <div className="info-box glow">
            <div className="info-label">Date & Time</div>
            <div className="info-value">Saturday, July 25, 2026</div>
            <div className="info-value">6:00 PM</div>
          </div>

          <a
            className="info-box glow location-link"
            href="https://www.google.com/maps/search/?api=1&query=23529+Tamarack+St+NW,+St+Francis,+MN+55070"
            target="_blank"
            rel="noreferrer"
          >
            <div className="info-label">Location</div>
            <div className="info-value">
              23529 Tamarack St NW, St Francis, MN 55070
            </div>
            <div className="info-sub">Tap to open in maps</div>
          </a>
        </div>

        <div className="rsvp-counter">Current RSVPs: {rsvpCount}</div>

        <button onClick={fetchRSVPs} className="refresh-btn">
          Refresh Count
        </button>
      </div>

      <div className="grid">
        {/* RSVP */}
        <div className="card">
          <h2>RSVP</h2>

          <input
            className="field"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="field"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="gold-btn" onClick={submitRSVP}>
            Submit RSVP
          </button>
        </div>

        {/* BABY POOL */}
        <div className="card">
          <h2>Baby Pool</h2>

          <input
            className="field"
            placeholder="Your name"
            value={guessName}
            onChange={(e) => setGuessName(e.target.value)}
          />

          <input
            className="field"
            type="date"
            value={guessDate}
            onChange={(e) => setGuessDate(e.target.value)}
          />

          <input
            className="field"
            placeholder="Optional: baby weight guess"
            value={guessWeight}
            onChange={(e) => setGuessWeight(e.target.value)}
          />

          <button className="gold-btn" onClick={submitGuess}>
            Submit Guess
          </button>
        </div>

        {/* PHOTO UPLOAD */}
        <div className="card">
          <h2>Upload Photo</h2>

          <p style={{ marginBottom: "10px", opacity: 0.8 }}>
            Share a photo of dad or from the party 📸
          </p>

          <input type="file" onChange={(e) => setFile(e.target.files[0])} />

          <button className="gold-btn" onClick={uploadPhoto}>
            Upload
          </button>
        </div>
      </div>

      {/* ATTENDEES */}
      <div className="card">
        <h2>Who's Coming</h2>

        {attendees.map((a, i) => (
          <div key={i} className="leaderboard-item">
            {a.name}
          </div>
        ))}
      </div>

      {/* BABY POOL LEADERBOARD */}
      <div className="card">
        <h2>Baby Pool Leaderboard</h2>

        <button onClick={fetchGuesses} className="refresh-btn">
          Refresh Pool
        </button>

        {guesses.map((g, i) => (
          <div key={i} className="leaderboard-item">
            #{i + 1} {g.name} — {g.date} {g.weight && `• ${g.weight}`}
          </div>
        ))}
      </div>

      {/* PHOTO GALLERY */}
      <div className="card">
        <h2>Photo Gallery</h2>

        <button onClick={fetchPhotos} className="refresh-btn">
          Refresh Gallery
        </button>

        <button
          className="gold-btn"
          onClick={() => {
            photos.forEach((url) => window.open(url, "_blank"));
          }}
        >
          Download All
        </button>

        <div className="gallery">
          {photos.map((p, i) => (
            <img key={i} src={p} alt="" />
          ))}
        </div>
      </div>

      {/* EXTRA FUN SECTION */}
      <div className="card">
        <h2>Event Highlights</h2>
        <ul style={{ lineHeight: "1.8" }}>
          <li>🍻 Keg provided</li>
          <li>🌮 Walking tacos</li>
          <li>📸 Photo sharing</li>
          <li>🎯 Baby pool competition</li>
          <li>🎉 Good vibes only</li>
        </ul>
      </div>
    </div>
  );
}
