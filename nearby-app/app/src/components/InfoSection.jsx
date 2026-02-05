import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './InfoSection.css';

const faqData = [
  {
    id: 'free',
    question: 'Is Nearby Nearby free to use?',
    answer: [
      "Yes. Nearby Nearby is completely free for users. You can explore local businesses, parks, events, and soon services, volunteer opportunities, jobs, and more without paying a fee. We'll never charge users to explore or connect with their community. Nearby Nearby was created to make rural life more visible, not more expensive. In an upcoming version, you'll be able to create a user profile to personalize your experience. You can save favorites, build custom lists, follow businesses, share local tips, and upload your own photos."
    ]
  },
  {
    id: 'different',
    question: 'How is Nearby Nearby different from Google, Yelp, or TripAdvisor?',
    answer: [
      "Most major platforms were built for cities, and their algorithms favor large marketing budgets. The information they show for rural areas is often wrong, outdated, or incomplete. GPS pins are frequently off or placed in the wrong location. Federal data shows that one in four rural GPS coordinates can be more than half a mile off target, and outdated maps make some towns look frozen in 2019. Rural businesses get labeled \"permanently closed,\" local restaurants never appear in results, and visitors drive straight through. The U.S. Chamber of Commerce estimates this invisibility costs rural America $47 billion every year.",
      "Nearby Nearby was created to fix that. Our results are based on distance, not ads or paid rankings. We go beyond general map data by including verified latitude and longitude coordinates to guide you directly to the front door of every location. We also work closely with local partners and residents to ensure every town is mapped accurately, visible online, and represented honestly."
    ]
  },
  {
    id: 'information',
    question: 'Where does Nearby Nearby get its information?',
    answer: [
      "Nearby Nearby is powered by grassroots data and community involvement. Our information is built from the ground up through area managers, local chambers, community groups, and residents who know their towns best. We focus on accurate, firsthand updates instead of scraped or outdated directories. Every listing helps make small towns more visible and connected."
    ]
  },
  {
    id: 'rural',
    question: 'Why focus on rural communities?',
    answer: [
      "Because rural America is the heartbeat of this country, and 97% of the United States is considered rural by land area. These communities are often invisible online. Businesses do not appear in search results, events are hard to find, and travelers often pass through without realizing the amazing experiences just down the road.",
      "Nearby Nearby exists to change that. By making it easy to find local places and experiences, we help rural communities grow stronger and take pride in the places they call home."
    ]
  },
  {
    id: 'listed',
    question: 'How can my business or event be listed?',
    answer: [
      "We're beginning in Pittsboro, North Carolina, and will expand throughout Chatham County next. If you're outside this area, you can still submit your information to be among the first to know when Nearby Nearby comes to your county."
    ]
  },
  {
    id: 'next',
    question: "What's next for Nearby Nearby?",
    answer: [
      "We are starting in Chatham County, North Carolina, and expanding county by county. We're taking things slow and steady to make sure we get our first county right before growing across North Carolina and beyond.",
      "Next up are user profiles, saved favorites, custom lists, and trip-planning tools that make discovering what's nearby even more personal. Business user profiles will allow owners to log in, update and maintain their own listings, and add events directly to their pages.",
      "We're also continuing research and development on grassroots disaster response and recovery, strengthening how communities can connect, share resources, and get accurate local information when it matters most."
    ]
  }
];

function InfoSection() {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section className="nn-info">
      <div className="nn-info__inner">
        {faqData.map((faq) => {
          const isOpen = expandedSections[faq.id];

          return (
            <article key={faq.id} className="nn-faq">
              <button
                onClick={() => toggleSection(faq.id)}
                className="nn-faq__header"
                aria-expanded={isOpen}
              >
                <span className="nn-faq__q">{faq.question}</span>
                {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
              {isOpen && (
                <div className="nn-faq__content">
                  {faq.answer.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default InfoSection;
