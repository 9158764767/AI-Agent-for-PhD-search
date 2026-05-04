import { Profile, PhDPosition } from "./types";

export const INITIAL_PROFILE: Profile = {
  name: "Abhishek Hirve",
  email: "abhishek.hirve97@gmail.com",
  bio: "AI and data researcher focused on human-centered evaluation of AI systems for safety-critical aviation decision support. Strong foundation in ML, data analytics, and scalable AI systems.",
  education: [
    { degree: "MS in Artificial Intelligence", uni: "University of Verona, Italy", year: "Oct 2025 (Expected)" },
    { degree: "Master of Information Technology", uni: "The University of Auckland, NZ", year: "2020" },
    { degree: "Bachelor of Computer Applications", uni: "University of Pune, India", year: "2018" }
  ],
  skills: [
    "Python", "SQL", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", 
    "Big Data (Spark, Kafka)", "Data Engineering (ETL/ELT)", "Docker", "Explainable AI (XAI)", "NLP"
  ],
  interests: [
    "Human-Centered AI", "Explainable AI (XAI)", "Aviation Safety Systems", "Collaborative AI-Human Decision Making", "Scalable ML Pipelines"
  ]
};

export const INITIAL_POSITIONS: PhDPosition[] = [
  {
    id: "uu-ai-hcdm",
    title: "PhD position in AI and Human Centered Decision Making",
    university: "Utrecht University",
    location: "Utrecht, Netherlands",
    deadline: "2026-06-15",
    applyLink: "https://www.uu.nl/en/organisation/working-at-utrecht-university/jobs/phd-position-in-ai-and-human-centered-decision-making",
    description: "Research how AI and data shape real-world decision-making, combining explainable AI, analytics, and collaboration with external organisations. You will join the Human-Centered Computing group and work on impactful industry-related AI challenges.",
    contactEmail: "recruitment@uu.nl",
    matchScore: 95,
    matchAnalysis: "Direct alignment with your research interest in human-centered evaluation and explainable AI. Your experience with aviation safety-critical systems is a unique asset for complex decision-making research."
  },
  {
    id: "eth-seq-dec",
    title: "PhD Position in Sequential Decision-Making",
    university: "ETH Zurich",
    location: "Zurich, Switzerland",
    deadline: "2026-05-30",
    applyLink: "https://eth-gethired.ch/en/jobs/",
    description: "Focus on reinforcement learning and sequential decision protocols in complex environments. Join the Machine Learning and Optimization group.",
    contactEmail: "prof-ml@ethz.ch",
    matchScore: 82,
    matchAnalysis: "Your background in meta-learning and predictive maintenance pipelines provides a solid foundation for sequential decision tasks."
  },
  {
    id: "mcml-ai-research",
    title: "Research Assistant (pre-doc) in AI for Safety",
    university: "Munich Center for Machine Learning (LMU/TUM)",
    location: "Munich, Germany",
    deadline: "2026-07-01",
    applyLink: "https://mcml.ai/career/",
    description: "Multi-disciplinary positions available across Munich's top universities focusing on trustworthy and robust machine learning for critical applications.",
    contactEmail: "career@mcml.ai",
    matchScore: 88,
    matchAnalysis: "Matches your proficiency in robust ML and aviation safety simulations. Significant interest in German-speaking institutions."
  }
];
