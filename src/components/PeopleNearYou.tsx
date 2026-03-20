"use client";

import Link from "next/link";

const PEOPLE = [
  { id: "1", name: "Sarah",   role: "Designer",   img: "https://randomuser.me/api/portraits/women/44.jpg", status: "available" },
  { id: "2", name: "Marcus",  role: "Engineer",   img: "https://randomuser.me/api/portraits/men/32.jpg",   status: "available" },
  { id: "3", name: "Aisha",   role: "VC Partner", img: "https://randomuser.me/api/portraits/women/68.jpg", status: "not_available" },
  { id: "4", name: "James",   role: "Founder",    img: "https://randomuser.me/api/portraits/men/75.jpg",   status: "available" },
  { id: "5", name: "Priya",   role: "PM",         img: "https://randomuser.me/api/portraits/women/90.jpg", status: "available" },
  { id: "6", name: "Luca",    role: "Designer",   img: "https://randomuser.me/api/portraits/men/46.jpg",   status: "not_available" },
  { id: "7", name: "Elena",   role: "Founder",    img: "https://randomuser.me/api/portraits/women/21.jpg", status: "available" },
];

export default function PeopleNearYou() {
  return (
    <div>
      {/* Header — inside normal px-4 flow */}
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-base font-black" style={{ color: "var(--c-text1)" }}>People Near You</h2>
        <Link href="/network" className="text-xs font-semibold" style={{ color: "#4A27E8" }}>See all</Link>
      </div>

      {/* Scroll track — full width, no clipping */}
      <div
        style={{
          overflowX: "scroll",
          overflowY: "visible",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingLeft: "16px",
          paddingRight: "16px",
          paddingBottom: "4px",
          display: "flex",
          gap: "16px",
          touchAction: "pan-x",
          cursor: "grab",
        }}
      >
        {PEOPLE.map((person) => (
          <Link
            key={person.id}
            href={`/network`}
            className="flex flex-col items-center flex-shrink-0 active:scale-95 transition-transform"
            style={{ gap: "8px", width: "72px", textDecoration: "none" }}
          >
            {/* Gradient ring */}
            <div
              style={{
                padding: "3px",
                borderRadius: "24px",
                background: person.status === "available"
                  ? "linear-gradient(135deg, #10B981 0%, #34D399 100%)"
                  : "linear-gradient(135deg, #EAB308 0%, #FCD34D 100%)",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={person.img}
                alt={person.name}
                draggable={false}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "21px",
                  objectFit: "cover",
                  display: "block",
                  border: "2.5px solid var(--c-card)",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              />
            </div>

            <p
              className="text-center w-full truncate font-semibold"
              style={{ fontSize: "11px", lineHeight: 1, color: "var(--c-text1)" }}
            >
              {person.name}
            </p>
            <p
              className="text-center w-full truncate"
              style={{ fontSize: "10px", lineHeight: 1, color: "var(--c-text3)", marginTop: "-4px" }}
            >
              {person.role}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
