import React, { useEffect, useState } from "react";
import "./styles.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://pwkqtiuqxlhxcrjmrmhe.supabase.co",
  "sb_publishable_2fEX9SGp-_TI3H4mgiEivw_99BW4uqf"
);

const BUCKET = "party-photos";

export default function App() {
  const [rsvpCount, setRsvpCount] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [attendees, setAttendees] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guessDate, setGuessDate] = useState("");
  const [guessWeight, setGuessWeight] = useState("");
  const [photo, setPhoto] = useState(null);

  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [poolGuesses, setPoolGuesses] = useState([]);

  const [loadingGallery, setLoadingGallery] = useState(false);
  const [loadingRsvps, setLoadingRsvps] = useState(false);
  const [loadingPool, setLoadingPool] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const loadRsvps = async () => {
    setLoadingRsvps(true);
    const { data, error } = await supabase
      .from("party_rsvps")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoadingRsvps(false);
      return;
    }

    setRsvps(data || []);
    setLoadingRsvps(false);
  };

  const loadPoolGuesses = async () => {
    setLoadingPool(true);
    const { data, error } = await supabase
      .from("baby_pool_guesses")
      .select("*")
      .order("guess_date", { ascending: true });

    if (error) {
      alert(error.message);
      setLoadingPool(false);
      return;
    }

    setPoolGuesses(data || []);
    setLoadingPool(false);
  };

  const loadPhotos = async () => {
    setLoadingGallery(true);

    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });

    if (error) {
      alert(error.message);
      setLoadingGallery(false);
      return;
    }

    const imageFiles = (data || []).filter((file) => {
      const lower = file.name.toLowerCase();
      return (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".gif")
      );
    });

    const mapped = imageFiles.map((file) => {
      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(file.name);

      return {
        id: file.id || file.name,
        name: file.name,
        url: publicData.publicUrl,
      };
    });

    setPhotos(mapped);
    setLoadingGallery(false);
  };

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

    const { error } = await supabase.from("party_rsvps").insert([
      {
        name: name.trim(),
        email: email.trim() || null,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setEmail("");
    fetchRSVPs();
  }

  const submitGuess = async () => {
    if (!guessDate) {
      alert("Pick a date guess first.");
      return;
    }

    const { error } = await supabase.from("baby_pool_guesses").insert([
      {
        name: name.trim() || "Guest",
        guess_date: guessDate,
        guess_weight: guessWeight.trim() || null,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

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

        <h1 className="headline">Baby Perez Diaper Party</h1>

        <p className="subhead">Men only • Bring a pack of diapers • BYOB</p>

        <p className="description">
          Come hang out, bring diapers, bring your own drinks, and help us
          celebrate Baby Perez before the little one gets here.
        </p>

        <div className="details-grid">
          <div className="info-box glow">
            <div className="info-label">Date &amp; Time</div>
            <div className="info-value">Friday, July 10, 2026</div>
            <div className="info-value">7:00 PM</div>
          </div>

          <a
            className="info-box glow location-link"
            href="https://www.google.com/maps/search/?api=1&query=23529%20Tamarack%20St%20NW%2C%20St%20Francis%2C%20MN%2055070"
            target="_blank"
            rel="noreferrer"
          >
            <div className="info-label">Location</div>
            <div className="info-value">
              23529 Tamarack St NW, St Francis, MN 55070
            </div>
            <div className="tap-text">Tap to open in maps</div>
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
