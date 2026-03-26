/**
 * seed-essays.ts
 * Seeds essay prompts for top ~50 schools into Supabase.
 *
 * Usage:
 *   npx ts-node --project tsconfig.seed.json scripts/seed-essays.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --------------------------------------------------------------------------
// Essay data: { scorecardId, schoolName, prompts }
// scorecardId is the College Scorecard unit_id for each school
// --------------------------------------------------------------------------

const ESSAYS: {
  scorecardId: string;
  schoolName: string;
  city: string;
  state: string;
  schoolType: "Public" | "Private";
  prompts: { text: string; wordLimit: number | null }[];
}[] = [
  {
    scorecardId: "166027",
    schoolName: "Massachusetts Institute of Technology",
    city: "Cambridge", state: "MA", schoolType: "Private",
    prompts: [
      { text: "We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it.", wordLimit: 250 },
      { text: "At MIT, we bring people together to better the lives of others. MIT students work to improve their communities in different ways, from tackling challenges at the local and regional level to tackling challenges at the national and international level. How has the world you come from shaped who you are today? For example, your family, culture, community, all have made you who you are. What is one thing you want us to know about your background that will help us understand who you are?", wordLimit: 250 },
      { text: "MIT brings people with diverse backgrounds together to collaborate, from tackling the world's greatest challenges to lending a helping hand. Describe one way you have collaborated with others to learn from them or to help them learn from you.", wordLimit: 250 },
      { text: "How has your perspective on the world been changed by what you have learned or experienced?", wordLimit: 250 },
      { text: "Describe the most significant challenge you've faced or something important that didn't go according to plan. How did you manage the situation?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "130794",
    schoolName: "Yale University",
    city: "New Haven", state: "CT", schoolType: "Private",
    prompts: [
      { text: "Students at Yale have plenty of time to explore their academic interests before committing to one or more major fields of study. Many students who apply to Yale have a specific area of academic focus in mind. If this is the case for you, we'd like to know what draws you to this area of study. Please indicate up to three areas in which you are considering concentrating your studies.", wordLimit: 150 },
      { text: "What is it about Yale that has led you to apply? Please be as specific as possible in explaining your interest.", wordLimit: 125 },
      { text: "Tell us about a person who has had a significant influence on you and describe that influence.", wordLimit: 200 },
      { text: "Reflect on your engagement with a community to which you belong. How do you feel you have contributed to this community?", wordLimit: 200 },
    ],
  },
  {
    scorecardId: "243744",
    schoolName: "Princeton University",
    city: "Princeton", state: "NJ", schoolType: "Private",
    prompts: [
      { text: "Princeton has a longstanding commitment to service and civic engagement. Tell us how your story intersects or will intersect with these ideals.", wordLimit: 250 },
      { text: "As a research institution that also prides itself on its liberal arts curriculum, Princeton allows students to explore areas across the humanities and the arts, the natural sciences, and the social sciences. What academic areas most interest you, and how do you imagine you will use your studies at Princeton?", wordLimit: 250 },
      { text: "Princeton is fundamentally a community. All we ask is that you be yourself, talk to us about your own life, and tell us what makes you, you.", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "144050",
    schoolName: "University of Chicago",
    city: "Chicago", state: "IL", schoolType: "Private",
    prompts: [
      { text: "How does the University of Chicago, as you know it now, satisfy your desire for a particular kind of learning, community, and future? Please address with some specificity your own wishes and how they relate to UChicago.", wordLimit: 250 },
      { text: "Essay option: Choose one of UChicago's famous 'uncommon essay' prompts. Example prompt: \"The word 'disenchantment' contains, literally, an 'enchantment.' Find a word that contains its own opposite (or a word that means its own opposite), and use it as a starting point for your essay.\"", wordLimit: 650 },
    ],
  },
  {
    scorecardId: "215062",
    schoolName: "University of Pennsylvania",
    city: "Philadelphia", state: "PA", schoolType: "Private",
    prompts: [
      { text: "How will you explore your intellectual and academic interests at the University of Pennsylvania? Please answer this question given the specific undergraduate school to which you are applying.", wordLimit: 150 },
      { text: "At Penn, learning and growth happen outside of the classroom, too. How will you explore the community at Penn? Consider how this community will shape your own perspectives and identity, and how your identity and perspective will help shape this community. Please answer this question given the specific undergraduate school to which you are applying.", wordLimit: 150 },
    ],
  },
  {
    scorecardId: "190150",
    schoolName: "Columbia University",
    city: "New York", state: "NY", schoolType: "Private",
    prompts: [
      { text: "List a selection of texts, resources and outlets that have contributed to your intellectual development outside of academic courses, including but not limited to books, journals, websites, podcasts, essays, or other content that you enjoy.", wordLimit: 150 },
      { text: "A hallmark of the Columbia experience is being able to learn and thrive in an equitable and inclusive community with a wide range of perspectives. Tell us about an aspect of your own perspective, viewpoint, or lived experience that is important to you, and describe how it has shaped the way you would learn from and contribute to Columbia's diverse and collaborative community.", wordLimit: 200 },
      { text: "Why are you interested in attending Columbia University? We encourage you to consider the aspect(s) that you find unique and compelling about Columbia.", wordLimit: 200 },
      { text: "What attracts you to your preferred areas of study at Columbia College or Columbia Engineering?", wordLimit: 150 },
    ],
  },
  {
    scorecardId: "164924",
    schoolName: "Dartmouth College",
    city: "Hanover", state: "NH", schoolType: "Private",
    prompts: [
      { text: "As you seek admission to Dartmouth's Class of 2028, what aspects of the college's academic program, community, or campus environment attract you? How is Dartmouth a good fit for you?", wordLimit: 100 },
      { text: "The Hawaiian word mo'olelo is often translated as 'story' but it can also refer to history, legend, genealogy, and tradition. Use one of these translations as a lens through which to tell us about yourself.", wordLimit: 250 },
      { text: "What excites you most about the opportunities you'll have at Dartmouth?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "189097",
    schoolName: "Cornell University",
    city: "Ithaca", state: "NY", schoolType: "Private",
    prompts: [
      { text: "Why Cornell? Tell us about your interest in your chosen college of enrollment within Cornell. Why does this college best fit your intellectual curiosity, academic preparation, and passion? Your response should show your knowledge of, and interest in, your chosen college.", wordLimit: 650 },
    ],
  },
  {
    scorecardId: "163286",
    schoolName: "Johns Hopkins University",
    city: "Baltimore", state: "MD", schoolType: "Private",
    prompts: [
      { text: "Johns Hopkins University was founded in the spirit of discovery and with the belief that education is a process of inquiry. Write a brief essay in which you reflect on the ways that history or background has shaped who you are and the opportunities you've had.", wordLimit: 400 },
      { text: "Tell us about a passion, an idea, a question you have about the world, or anything that has captured your intellectual curiosity for a sustained period of time. What are you so passionate about that you lose track of time? How has this passion developed over time?", wordLimit: 400 },
    ],
  },
  {
    scorecardId: "186131",
    schoolName: "Duke University",
    city: "Durham", state: "NC", schoolType: "Private",
    prompts: [
      { text: "What is your sense of Duke as a university and a community, and why do you consider it a good match for you? If there's something in particular about our offerings that attracts you, feel free to share that as well.", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "147767",
    schoolName: "Northwestern University",
    city: "Evanston", state: "IL", schoolType: "Private",
    prompts: [
      { text: "Other parts of your application give us a sense for how you might contribute to Northwestern. But we also want to know how Northwestern will contribute to your journey. Beyond the opportunities in your intended area of study, what's drawing you to Northwestern and how do you see yourself engaging with our community?", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "221999",
    schoolName: "Vanderbilt University",
    city: "Nashville", state: "TN", schoolType: "Private",
    prompts: [
      { text: "Vanderbilt offers a community where students find balance between their academic and social identities. What are some of your favorite social interests or hobbies? What role has community played in developing or refining those interests?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "243780",
    schoolName: "Rice University",
    city: "Houston", state: "TX", schoolType: "Private",
    prompts: [
      { text: "The residential college system at Rice builds a campus culture where students are supported and challenge each other in and out of the classroom. What opportunities at Rice appeal to you and how would you contribute to the campus community?", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "152080",
    schoolName: "University of Notre Dame",
    city: "Notre Dame", state: "IN", schoolType: "Private",
    prompts: [
      { text: "Describe how Notre Dame's mission, values, and community align with your interests and what you hope to gain from your time at Notre Dame. Please be as specific as possible in your response.", wordLimit: 200 },
    ],
  },
  {
    scorecardId: "131496",
    schoolName: "Georgetown University",
    city: "Washington", state: "DC", schoolType: "Private",
    prompts: [
      { text: "Briefly discuss the significance to you of the school or summer activity in which you have been most involved.", wordLimit: 250 },
      { text: "As Georgetown is a diverse community, the Admissions Committee would like to know more about you in your own words. Please submit a brief essay, either personal or creative, which you feel best describes you.", wordLimit: 250 },
      { text: "Georgetown is located in Washington, D.C., the heart of American politics, diplomacy, and public policy. What do you hope to study at Georgetown, and how does Georgetown's location influence your decision to apply?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "139755",
    schoolName: "Emory University",
    city: "Atlanta", state: "GA", schoolType: "Private",
    prompts: [
      { text: "What is a hard problem you have had to solve, intellectual or otherwise? What made it hard? How did you approach it?", wordLimit: 150 },
      { text: "Why are you interested in Emory University?", wordLimit: 150 },
    ],
  },
  {
    scorecardId: "168148",
    schoolName: "Tufts University",
    city: "Medford", state: "MA", schoolType: "Private",
    prompts: [
      { text: "Which aspects of Tufts' curriculum or undergraduate experience prompt your application? In short, 'Why Tufts?'", wordLimit: 100 },
      { text: "SMFA at Tufts: How has your art-making or other creative activity been shaped by your history, identity, and/or community?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "179867",
    schoolName: "Washington University in St. Louis",
    city: "St. Louis", state: "MO", schoolType: "Private",
    prompts: [
      { text: "Why are you interested in Washington University? If you have a specific academic department, program of study, or area of research in mind, you may discuss it here. Please limit your response to 250 words.", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "164988",
    schoolName: "Boston College",
    city: "Chestnut Hill", state: "MA", schoolType: "Private",
    prompts: [
      { text: "Great art can transform ordinary experiences into something extraordinary. Tell us about a work of art, literature, music, or film that has affected your thinking and describe the impact.", wordLimit: 400 },
      { text: "Boston College strives to provide an undergraduate experience that is both rigorous and fulfilling. Please share something about yourself that will help us understand how you will contribute to the Boston College community.", wordLimit: 400 },
    ],
  },
  {
    scorecardId: "193900",
    schoolName: "New York University",
    city: "New York", state: "NY", schoolType: "Private",
    prompts: [
      { text: "We would like to know more about your interest in NYU. What prompted you to apply to NYU? Why have you applied or expressed interest in a particular campus, school, college, program, and/or area of study? If you have applied to more than one, please also tell us why you are interested in these additional schools or programs.", wordLimit: 400 },
    ],
  },
  {
    scorecardId: "228723",
    schoolName: "University of Southern California",
    city: "Los Angeles", state: "CA", schoolType: "Private",
    prompts: [
      { text: "Describe how you plan to pursue your academic interests and why you want to explore them at USC specifically. Please feel free to address your first- and second-choice major selections.", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "110662",
    schoolName: "University of California, Los Angeles",
    city: "Los Angeles", state: "CA", schoolType: "Public",
    prompts: [
      { text: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.", wordLimit: 350 },
      { text: "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.", wordLimit: 350 },
      { text: "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?", wordLimit: 350 },
      { text: "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.", wordLimit: 350 },
    ],
  },
  {
    scorecardId: "110635",
    schoolName: "University of California, Berkeley",
    city: "Berkeley", state: "CA", schoolType: "Public",
    prompts: [
      { text: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.", wordLimit: 350 },
      { text: "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.", wordLimit: 350 },
      { text: "What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?", wordLimit: 350 },
      { text: "Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.", wordLimit: 350 },
    ],
  },
  {
    scorecardId: "170976",
    schoolName: "University of Michigan",
    city: "Ann Arbor", state: "MI", schoolType: "Public",
    prompts: [
      { text: "Everyone belongs to many different communities and/or groups defined by (among other things) shared geography, religion, ethnicity, income, cuisine, interest, race, ideology, or intellectual heritage. Choose one of the communities to which you belong, and describe that community and your place within it.", wordLimit: 300 },
      { text: "Describe the unique qualities that attract you to the specific undergraduate College or School (including preferred admission and dual degree programs) to which you are applying at the University of Michigan. How would that curriculum support your interests?", wordLimit: 550 },
    ],
  },
  {
    scorecardId: "234076",
    schoolName: "University of Virginia",
    city: "Charlottesville", state: "VA", schoolType: "Public",
    prompts: [
      { text: "What work of art, music, science, mathematics, or literature has surprised, unsettled, or challenged you, and in what way?", wordLimit: 250 },
      { text: "Why are you applying to UVA and what do you hope to do here?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "199120",
    schoolName: "University of North Carolina at Chapel Hill",
    city: "Chapel Hill", state: "NC", schoolType: "Public",
    prompts: [
      { text: "Discuss one of your personal qualities and share a story, anecdote, or memory that shows how this quality has helped you make the most of an opportunity or overcome a challenge. (250-300 words)", wordLimit: 300 },
      { text: "Tell us how one of Carolina's specific programs, opportunities, or initiatives has influenced your decision to apply. (250-300 words)", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "231624",
    schoolName: "College of William & Mary",
    city: "Williamsburg", state: "VA", schoolType: "Public",
    prompts: [
      { text: "William & Mary students self-identify as 'nerds'—this isn't a pejorative but a celebratory label that recognizes intellectual curiosity and passion for learning. What nerdy fact or concept do you know about (from any field or discipline) and why does it captivate you?", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "139658",
    schoolName: "Georgia Institute of Technology",
    city: "Atlanta", state: "GA", schoolType: "Public",
    prompts: [
      { text: "Why do you want to study your chosen major, and why do you want to study it at Georgia Tech?", wordLimit: 300 },
      { text: "Beyond your career, how do you hope your Georgia Tech education will prepare you as a global citizen?", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "211440",
    schoolName: "Carnegie Mellon University",
    city: "Pittsburgh", state: "PA", schoolType: "Private",
    prompts: [
      { text: "Most students choose their college based on its reputation or ranking. We're curious — what do you know about Carnegie Mellon that makes you want to attend? (If you're applying to multiple colleges/programs at CMU, you may answer for your first-choice program.)", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "130697",
    schoolName: "Wesleyan University",
    city: "Middletown", state: "CT", schoolType: "Private",
    prompts: [
      { text: "Using the information from the application, discuss the ways in which your choice of major, minor, or program of study will allow you to engage with and build upon your existing and future intellectual interests.", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "168218",
    schoolName: "Williams College",
    city: "Williamstown", state: "MA", schoolType: "Private",
    prompts: [
      { text: "Every first-year student at Williams lives in an Entry, a mix of about 40 students from all class years, overseen by a group of Junior Advisors (JAs). (Think of a JA as a combination orientation guide, life coach, and co-conspirator in the adventure of living at Williams.) We've found that in the college search process, students are often asked to consider what they want in a college. Today we'd like you to reflect on what you can bring to a Williams Entry and to the larger Williams community.", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "128902",
    schoolName: "Amherst College",
    city: "Amherst", state: "MA", schoolType: "Private",
    prompts: [
      { text: "Amherst College's mission is to educate young people of exceptional potential from all backgrounds so that they may seek, value, and advance knowledge, engage the world around them, and lead principled lives of consequence. We believe that an Amherst education serves both the individual and the public good.", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "166513",
    schoolName: "Middlebury College",
    city: "Middlebury", state: "VT", schoolType: "Private",
    prompts: [
      { text: "Please respond to one of the following prompts. If you choose the creative prompt, please indicate which type of creative work you are presenting (writing, art, music, etc.) in the subject line.", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "110680",
    schoolName: "University of California, San Diego",
    city: "La Jolla", state: "CA", schoolType: "Public",
    prompts: [
      { text: "Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.", wordLimit: 350 },
      { text: "Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?", wordLimit: 350 },
    ],
  },
  {
    scorecardId: "236948",
    schoolName: "University of Washington",
    city: "Seattle", state: "WA", schoolType: "Public",
    prompts: [
      { text: "Our families and communities often define us and our opportunities. Discuss how your family or a community you are part of has defined who you are today, and/or the opportunities you may have had and/or missed.", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "144740",
    schoolName: "University of Illinois Urbana-Champaign",
    city: "Champaign", state: "IL", schoolType: "Public",
    prompts: [
      { text: "Why are you applying to the University of Illinois, and what major are you pursuing? How does this major align with your goals and interests?", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "215293",
    schoolName: "Pennsylvania State University",
    city: "University Park", state: "PA", schoolType: "Public",
    prompts: [
      { text: "Penn State has a rich tradition of student engagement. How do you hope to contribute to our community through your pursuits?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "228769",
    schoolName: "University of Texas at Austin",
    city: "Austin", state: "TX", schoolType: "Public",
    prompts: [
      { text: "Why are you interested in the major you indicated as your first-choice major? (Note: students applying to the business program should address leadership.)", wordLimit: 500 },
      { text: "Describe a challenge you have faced and what you learned from it.", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "217156",
    schoolName: "University of Pittsburgh",
    city: "Pittsburgh", state: "PA", schoolType: "Public",
    prompts: [
      { text: "Pitt is a place where people of all backgrounds, identities, and experiences come together. Describe how your own background has shaped the perspective that you will contribute to the Pitt community.", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "190512",
    schoolName: "Fordham University",
    city: "Bronx", state: "NY", schoolType: "Private",
    prompts: [
      { text: "Fordham is a Jesuit university. How might Fordham's Jesuit mission and identity be a good fit for you?", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "200280",
    schoolName: "Northeastern University",
    city: "Boston", state: "MA", schoolType: "Private",
    prompts: [
      { text: "Tell us about a topic or idea that excites you. What draws you to it? How do you see it connecting to your studies at Northeastern?", wordLimit: 300 },
      { text: "Tell us about a real-world example of a problem you care about and how you might approach solving it at Northeastern.", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "130183",
    schoolName: "University of Connecticut",
    city: "Storrs", state: "CT", schoolType: "Public",
    prompts: [
      { text: "Tell us what you think makes UConn a good fit for you, and why you want to study your chosen major here.", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "133951",
    schoolName: "University of Florida",
    city: "Gainesville", state: "FL", schoolType: "Public",
    prompts: [
      { text: "Describe any unique experiences or circumstances that distinguish you from other applicants.", wordLimit: 600 },
    ],
  },
  {
    scorecardId: "126614",
    schoolName: "University of Colorado Boulder",
    city: "Boulder", state: "CO", schoolType: "Public",
    prompts: [
      { text: "Describe how your background, identity, interests, and/or activities will contribute to the CU Boulder community.", wordLimit: 250 },
    ],
  },
  {
    scorecardId: "174066",
    schoolName: "University of Minnesota, Twin Cities",
    city: "Minneapolis", state: "MN", schoolType: "Public",
    prompts: [
      { text: "What have you learned and how have you grown from your involvement in activities, work experience, or other experiences?", wordLimit: 500 },
    ],
  },
  {
    scorecardId: "163268",
    schoolName: "University of Maryland, College Park",
    city: "College Park", state: "MD", schoolType: "Public",
    prompts: [
      { text: "Tell us about a topic or field of study that interests you and explain why. How are you working to develop your interest in or knowledge of this subject?", wordLimit: 300 },
      { text: "Describe your involvement in a community service or extracurricular activity and what you gained from your experience.", wordLimit: 300 },
    ],
  },
  {
    scorecardId: "204796",
    schoolName: "Ohio State University",
    city: "Columbus", state: "OH", schoolType: "Public",
    prompts: [
      { text: "How has your background and experience prepared you to make an impact at Ohio State?", wordLimit: 250 },
    ],
  },
];

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  console.log(`Seeding ${ESSAYS.length} schools + essays...`);

  for (const school of ESSAYS) {
    // Upsert school
    const { error: schoolErr } = await supabase.from("schools").upsert(
      {
        id: school.scorecardId,
        name: school.schoolName,
        city: school.city,
        state: school.state,
        school_type: school.schoolType,
      },
      { onConflict: "id" }
    );

    if (schoolErr) {
      console.error(`Error upserting ${school.schoolName}:`, schoolErr.message);
      continue;
    }

    // Delete existing prompts for this school (clean slate)
    await supabase.from("essay_prompts").delete().eq("school_id", school.scorecardId);

    // Insert prompts
    const prompts = school.prompts.map((p) => ({
      school_id: school.scorecardId,
      prompt_text: p.text,
      word_limit: p.wordLimit,
    }));

    const { error: promptErr } = await supabase.from("essay_prompts").insert(prompts);

    if (promptErr) {
      console.error(`Error inserting prompts for ${school.schoolName}:`, promptErr.message);
    } else {
      console.log(`✓ ${school.schoolName} (${prompts.length} prompts)`);
    }
  }

  console.log("Done.");
}

main().catch(console.error);
