// types.ts

/**
 * Defines the structure for philosophical classifications.
 */
export type Classification = {
  oneMany: string;
  beingBecoming: string;
  mindMatter: string;
  freedomDeterminism: string;
  transcendentImmanent: string;
};

/**
 * Defines the main structure for a philosopher object.
 */
export type Philosopher = {
  name: string;
  birthYear: number;
  deathYear: number;
  domain: 'Metaphysics' | 'Logic' | 'Ethics' | 'Politics' | 'Aesthetics';
  description: string;
  spiralStage: string;
  classifications: Classification;
};

// Mappings for Visualization

/**
 * Maps Spiral Dynamics stages to specific color hex codes.
 */
export const spiralStageColors: Record<string, string> = {
  'Red': '#E74C3C',
  'Red-Orange': '#E67E22',
  'Orange': '#F39C12',
  'Blue-Orange': '#1ABC9C',
  'Blue': '#3498DB',
  'Green': '#2ECC71',
};

/**
 * Maps philosophical domains to a color and an azimuth angle range for radial charts.
 */
export const domainInfo = {
  'Ethics': { color: '#FF6B6B', angleRange: [0, 72] },
  'Aesthetics': { color: '#4ECDC4', angleRange: [72, 144] },
  'Logic': { color: '#45B7D1', angleRange: [144, 216] },
  'Politics': { color: '#F7D154', angleRange: [216, 288] },
  'Metaphysics': { color: '#B57EDC', angleRange: [288, 360] },
};


// Data File: philosophers.ts

/**
 * An array containing data for 30 key philosophers.
 */
export const philosophers: Philosopher[] = [
  {
    "name": "Plato",
    "birthYear": -428,
    "deathYear": -347,
    "domain": "Metaphysics",
    "description": "Ancient Greek philosopher, student of Socrates and teacher of Aristotle. Plato posited a realm of eternal Forms (ideas) that give structure to reality, unified by the Form of the Good. He taught that true reality is unchanging Being and that the physical world is “always becoming and never really is”, noting that \"the physical world is not as real or true as Forms\". He upheld rational freedom and grounded values in an absolute transcendent Good.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "Many (plural Forms)",
      "beingBecoming": "Being (eternal Forms)",
      "mindMatter": "Mind (idealism)",
      "freedomDeterminism": "Freedom (rational choice)",
      "transcendentImmanent": "Transcendent (realm of Forms)"
    }
  },
  {
    "name": "Aristotle",
    "birthYear": -384,
    "deathYear": -322,
    "domain": "Logic",
    "description": "Greek philosopher and student of Plato who systematized knowledge. Aristotle rejected Platonic dualism, viewing substances as compounds of matter and form. He wrote that \"every physical object is a compound of matter and form\", explaining change as form animating matter. He held that ethical virtue realizes human purpose, and defended voluntary choice as central to moral responsibility.",
    "spiralStage": "Blue-Orange",
    "classifications": {
      "oneMany": "Many (plural substances)",
      "beingBecoming": "Both (stable forms + change)",
      "mindMatter": "Matter–Form (hylomorphism)",
      "freedomDeterminism": "Freedom (voluntary choice)",
      "transcendentImmanent": "Immanent (values within nature)"
    }
  },
  {
    "name": "Socrates",
    "birthYear": -470,
    "deathYear": -399,
    "domain": "Ethics",
    "description": "Classical Athenian philosopher, credited as a founder of Western philosophy. Socrates emphasized ethical inquiry and the examined life. He engaged in dialectical questioning to seek moral truths and famously declared that \"the unexamined life is not worth living\". He believed in an inner divine sign and in knowledge of the Good, implying a transcendent moral order.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "Many (diverse virtues)",
      "beingBecoming": "Becoming (active life)",
      "mindMatter": "Mind (soul and reason)",
      "freedomDeterminism": "Freedom (moral choice)",
      "transcendentImmanent": "Transcendent (inner divine guidance)"
    }
  },
  {
    "name": "Immanuel Kant",
    "birthYear": 1724,
    "deathYear": 1804,
    "domain": "Ethics",
    "description": "Prussian philosopher of the Enlightenment, central figure in modern philosophy. Kant argued that our understanding shapes experience and insisted that freedom and moral law are rooted in practical reason. He is famous for the principle that we must treat humanity as an end in itself. He wrote: \"Two things fill the mind with ever new and increasing admiration and awe: the starry heavens above and the moral law within me\".",
    "spiralStage": "Blue-Orange",
    "classifications": {
      "oneMany": "Many (phenomenal vs noumenal realms)",
      "beingBecoming": "Being (timeless moral laws)",
      "mindMatter": "Mind (transcendental idealism)",
      "freedomDeterminism": "Both (phenomenal determinism & noumenal freedom)",
      "transcendentImmanent": "Transcendent (moral law beyond senses)"
    }
  },
  {
    "name": "Friedrich Nietzsche",
    "birthYear": 1844,
    "deathYear": 1900,
    "domain": "Ethics",
    "description": "German philosopher known for his critique of traditional values and religion. Nietzsche proclaimed that \"everything has evolved; there are no eternal facts, no absolute truths\" and saw reality as ceaseless becoming driven by a \"will to power.\" He elevated life and earthly instincts over transcendent ideals, arguing that moralities must be re-evaluated immanently. He denied free will as commonly conceived, advocating love of one’s fate.",
    "spiralStage": "Red-Orange",
    "classifications": {
      "oneMany": "Many (plural perspectives)",
      "beingBecoming": "Becoming (flux and evolution)",
      "mindMatter": "Matter (embodied will to power)",
      "freedomDeterminism": "Determinism (fate/amor fati)",
      "transcendentImmanent": "Immanent (earthly value-creation)"
    }
  },
  {
    "name": "René Descartes",
    "birthYear": 1596,
    "deathYear": 1650,
    "domain": "Metaphysics",
    "description": "French philosopher and mathematician, father of modern rationalism. Descartes sought certain knowledge by systematic doubt, famously asserting *\"Cogito, ergo sum\"* (\"I think, therefore I am\"). He posited a dualism of mind and body and initiated the turn to a mechanistic view of nature, grounding knowledge in clear ideas of reason. His work laid the foundations of modern science and philosophy.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "Many (dual substances Mind and Matter)",
      "beingBecoming": "Being (clear ideas as eternal truths)",
      "mindMatter": "Mind–Matter (strict dualism)",
      "freedomDeterminism": "Freedom (mind’s free will)",
      "transcendentImmanent": "Transcendent (innate ideas beyond empirical world)"
    }
  },
  {
    "name": "John Locke",
    "birthYear": 1632,
    "deathYear": 1704,
    "domain": "Politics",
    "description": "English philosopher, founder of British empiricism and liberalism. Locke argued that political authority rests on consent of the governed and that individuals have natural rights to \"life, liberty, and property\". He opposed divine right monarchy and influenced modern democracy. His epistemology held that the mind is a blank slate shaped by experience.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "Many (no innate ideas, plural experiences)",
      "beingBecoming": "Becoming (knowledge from experience)",
      "mindMatter": "Mind (empiricist focus on ideas)",
      "freedomDeterminism": "Freedom (natural rights and free will)",
      "transcendentImmanent": "Immanent (humanist social contract)"
    }
  },
  {
    "name": "David Hume",
    "birthYear": 1711,
    "deathYear": 1776,
    "domain": "Ethics",
    "description": "Scottish philosopher and historian, a leading empiricist and skeptic. Hume conceived philosophy as the science of human nature and famously argued that \"reason is… the slave of the passions\". He held that knowledge arises from sensory experience and that one cannot derive \"ought\" from \"is\", undermining causal certainties. He was skeptical of religion and metaphysics, focusing on natural psychology and ethics.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "Many (bundle theory of perceptions)",
      "beingBecoming": "Becoming (constant flux of impressions)",
      "mindMatter": "Mind (empirical mind, no innate ideas)",
      "freedomDeterminism": "Determinism (causal necessity, compatibilist)",
      "transcendentImmanent": "Immanent (naturalism, no supernatural)"
    }
  },
  {
    "name": "Thomas Aquinas",
    "birthYear": 1225,
    "deathYear": 1274,
    "domain": "Ethics",
    "description": "Italian Dominican friar and Scholastic philosopher-theologian. Aquinas synthesized Aristotelian philosophy with Christian theology, developing a philosophy of natural law accessible by reason. He taught that God is the ultimate cause and that human beings can know moral principles through rational reflection on nature. His approach grounded ethics and individual rights in a transcendent divine order.",
    "spiralStage": "Blue-Orange",
    "classifications": {
      "oneMany": "One (God as ultimate unity)",
      "beingBecoming": "Being (God as eternal being)",
      "mindMatter": "Mind (God/reason primary, but also matter-form)",
      "freedomDeterminism": "Freedom (human free will + divine grace)",
      "transcendentImmanent": "Transcendent (moral law from God)"
    }
  },
  {
    "name": "Jean-Jacques Rousseau",
    "birthYear": 1712,
    "deathYear": 1778,
    "domain": "Politics",
    "description": "Genevan-born philosopher and writer whose ideas influenced the French Revolution. Rousseau argued that civilization corrupts natural goodness and championed the \"general will\" of the people. He wrote, \"Man is born free; and everywhere he is in chains\" (from *The Social Contract*), calling for direct democracy and equality. He saw society as a collective of free individuals bound by an immanent social contract.",
    "spiralStage": "Green",
    "classifications": {
      "oneMany": "Many (plural society needs)",
      "beingBecoming": "Becoming (social progress/change)",
      "mindMatter": "Mind (focus on collective will)",
      "freedomDeterminism": "Freedom (natural freedom and virtue)",
      "transcendentImmanent": "Immanent (values in social contract)"
    }
  },
  {
    "name": "Karl Marx",
    "birthYear": 1818,
    "deathYear": 1883,
    "domain": "Politics",
    "description": "German philosopher, economist, and revolutionary socialist. Marx co-authored the Communist Manifesto and developed a materialist theory of history (historical materialism). He analyzed class struggle and capitalism, predicting that the working class would overthrow oppression. Marx is famous for the dictum \"Religion is the opium of the people\", reflecting his view that religion provides illusory comfort under exploitation.",
    "spiralStage": "Red",
    "classifications": {
      "oneMany": "Many (diverse social forces)",
      "beingBecoming": "Becoming (dialectical history)",
      "mindMatter": "Matter (materialist analysis)",
      "freedomDeterminism": "Determinism (economic forces shaping society)",
      "transcendentImmanent": "Immanent (focus on earthly change)"
    }
  },
  {
    "name": "Søren Kierkegaard",
    "birthYear": 1813,
    "deathYear": 1855,
    "domain": "Ethics",
    "description": "Danish philosopher and theologian, often called the first existentialist. Kierkegaard focused on individual subjectivity, choice, and faith in the face of uncertainty. He highlighted the paradox of time, famously noting: \"Life can only be understood backwards; but it must be lived forwards\". He emphasized personal responsibility and the 'leap of faith' beyond rational calculation.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "One (individual existence)",
      "beingBecoming": "Becoming (life as unfolding process)",
      "mindMatter": "Mind (inner self and faith)",
      "freedomDeterminism": "Freedom (existential choice)",
      "transcendentImmanent": "Transcendent (God and religious faith)"
    }
  },
  {
    "name": "Simone de Beauvoir",
    "birthYear": 1908,
    "deathYear": 1986,
    "domain": "Ethics",
    "description": "French existentialist philosopher and feminist writer. In *The Second Sex* she analyzed the social construction of gender, famously declaring \"One is not born, but rather becomes, a woman\". Beauvoir critiqued patriarchy and championed individual freedom and equality, emphasizing lived experience and ethical ambiguity in human life.",
    "spiralStage": "Green",
    "classifications": {
      "oneMany": "Many (no single essence of womanhood)",
      "beingBecoming": "Becoming (gender as process)",
      "mindMatter": "Mind (emphasis on consciousness and freedom)",
      "freedomDeterminism": "Freedom (radical choice and responsibility)",
      "transcendentImmanent": "Immanent (social conditions shape identity)"
    }
  },
  {
    "name": "Jean-Paul Sartre",
    "birthYear": 1905,
    "deathYear": 1980,
    "domain": "Ethics",
    "description": "French existentialist philosopher. Sartre proclaimed that \"existence precedes essence,\" meaning people first exist and then define themselves by choices. He held that humans are radically free: \"Man is condemned to be free… responsible for everything he does\". He denied any transcendent human nature or God, asserting that individuals must create their own values in an absurd world.",
    "spiralStage": "Green",
    "classifications": {
      "oneMany": "Many (no fixed human nature)",
      "beingBecoming": "Becoming (self-creation through choice)",
      "mindMatter": "Mind (conscious freedom prioritized)",
      "freedomDeterminism": "Freedom (radical free will)",
      "transcendentImmanent": "Immanent (values made by humans)"
    }
  },
  {
    "name": "Arthur Schopenhauer",
    "birthYear": 1788,
    "deathYear": 1860,
    "domain": "Ethics",
    "description": "German philosopher known for pessimistic metaphysics. Schopenhauer held that the one underlying reality is the blind, striving Will, and the empirical world is mere representation of this Will. He argued that individuals lack free will in shaping desires (*\"Man can do what he wills but he cannot will what he wills\"*) and saw ascetic denial of desire as a path to reduce suffering. He valued transcendent ideals over worldly demands.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "One (the Will as the singular reality)",
      "beingBecoming": "Being (constant Will, underlying flux)",
      "mindMatter": "Mind (world as representation of Will)",
      "freedomDeterminism": "Determinism (will-driven necessity)",
      "transcendentImmanent": "Transcendent (escape world of suffering)"
    }
  },
  {
    "name": "Baruch Spinoza",
    "birthYear": 1632,
    "deathYear": 1677,
    "domain": "Metaphysics",
    "description": "Dutch rationalist philosopher. Spinoza equated God with Nature and held that there is only one infinite Substance, which he called Deus sive Natura (\"God or Nature\"). All things (mind and body) are modes of this single Substance. In his *Ethics*, he argued that understanding the world as determined by natural necessity leads to human peace of mind.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "One (one Substance)",
      "beingBecoming": "Being (eternal substance)",
      "mindMatter": "Mind = Matter (attributes of substance)",
      "freedomDeterminism": "Determinism (strict necessity of nature)",
      "transcendentImmanent": "Immanent (God identical with nature)"
    }
  },
  {
    "name": "Georg Wilhelm Friedrich Hegel",
    "birthYear": 1770,
    "deathYear": 1831,
    "domain": "Metaphysics",
    "description": "German idealist philosopher. Hegel conceived reality as the unfolding of the Absolute Spirit through history. He argued that \"the real is rational\": truth emerges from a dialectical process reconciling opposites. For Hegel, being is dynamic (always becoming), and individual freedom is realized through awareness of necessity. He saw values as embodied in immanent social institutions (family, state), not beyond the world.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "One (Absolute Spirit)",
      "beingBecoming": "Becoming (dialectical process)",
      "mindMatter": "Mind (Absolute Idealism)",
      "freedomDeterminism": "Determinism (teleological necessity)",
      "transcendentImmanent": "Immanent (meaning in world history)"
    }
  },
  {
    "name": "Ludwig Wittgenstein",
    "birthYear": 1889,
    "deathYear": 1951,
    "domain": "Logic",
    "description": "Austrian-British philosopher of language and logic. Wittgenstein initially sought a fixed logical structure underlying language. Later he embraced pluralism: meaning comes from multiple \"language-games\" within forms of life. He emphasized that meaning is dynamic (use-dependent) and showed that philosophical problems arise from misunderstanding language. He viewed ethics as outside the world of facts, saying ethics is transcendental in his early view.",
    "spiralStage": "Green",
    "classifications": {
      "oneMany": "Many (many language-games)",
      "beingBecoming": "Becoming (meanings change with use)",
      "mindMatter": "Mind (analysis of language over materialism)",
      "freedomDeterminism": "N/A (sidestepped will debate)",
      "transcendentImmanent": "Transcendent (ethics lies beyond facts)"
    }
  },
  {
    "name": "Confucius",
    "birthYear": -551,
    "deathYear": -479,
    "domain": "Ethics",
    "description": "Chinese philosopher and teacher, considered the paragon of Chinese sages. Confucius emphasized personal and governmental morality, proper social relationships, and virtue. He advocated respect for family and hierarchical roles, and stated a version of the Golden Rule: \"Do not do to others what you do not want done to yourself\". His thought stresses harmony in society.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "Many (varied virtues and roles)",
      "beingBecoming": "Becoming (cultivation of virtue)",
      "mindMatter": "Mind (morality and benevolence)",
      "freedomDeterminism": "Freedom (moral agency within roles)",
      "transcendentImmanent": "Immanent (focus on human society)"
    }
  },
  {
    "name": "Laozi",
    "birthYear": -600,
    "deathYear": -531,
    "domain": "Metaphysics",
    "description": "Semi-legendary Chinese philosopher, author of the *Tao Te Ching*, and founder of philosophical Taoism. Laozi taught living in harmony with the Tao (\"Way\"), an underlying natural order. He emphasized simplicity, humility and non-action (wu wei) as the path to harmony. One famous line attributed to him is: \"Nature does not hurry, yet everything is accomplished.\"",
    "spiralStage": "Green",
    "classifications": {
      "oneMany": "One (the Tao as ultimate unity)",
      "beingBecoming": "Both (Tao is constant yet life flows)",
      "mindMatter": "Both (mind and nature unified in Tao)",
      "freedomDeterminism": "Immanent harmony (non-coercive alignment with natural course)",
      "transcendentImmanent": "Transcendent (ultimate Tao beyond words, but immanent in nature)"
    }
  },
  {
    "name": "Sun Tzu",
    "birthYear": -544,
    "deathYear": -496,
    "domain": "Politics",
    "description": "Chinese general and strategist, author of *The Art of War* (circa 5th century BCE). Sun Tzu taught that victory comes from knowledge and strategy rather than brute force. He wrote: \"To subdue the enemy without fighting is the acme of skill\". His philosophy emphasizes flexibility, intelligence, and harmonious use of force, reflecting a pragmatic view of power.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "Many (many tactics and tools)",
      "beingBecoming": "Becoming (adaptation and change in battle)",
      "mindMatter": "Matter (pragmatic military focus)",
      "freedomDeterminism": "Freedom (strategic choice of tactics)",
      "transcendentImmanent": "Immanent (seeking success in the material world)"
    }
  },
  {
    "name": "Voltaire",
    "birthYear": 1694,
    "deathYear": 1778,
    "domain": "Politics",
    "description": "French Enlightenment writer and philosopher. Voltaire championed reason, tolerance, and civil liberties against superstition and absolutism. He satirized dogma and intolerance, famously advising, \"Think for yourself and let others enjoy the privilege of doing so too\". He promoted freedom of speech and religion and criticized arbitrary authority.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "Many (plurality of viewpoints)",
      "beingBecoming": "Becoming (progress through reason)",
      "mindMatter": "Mind (rational critique)",
      "freedomDeterminism": "Freedom (individual liberties)",
      "transcendentImmanent": "Immanent (secular humanism)"
    }
  },
  {
    "name": "Michel Foucault",
    "birthYear": 1926,
    "deathYear": 1984,
    "domain": "Politics",
    "description": "French philosopher and historian, associated with structuralism and post-structuralism. Foucault analyzed power and discourse, arguing that knowledge and truth are products of social institutions. He wrote that \"where there is power, there is resistance\". He saw the self as constructed by social forces; truth and values are immanent, produced by systems of power/knowledge rather than by any transcendent source.",
    "spiralStage": "Green",
    "classifications": {
      "oneMany": "Many (plural discourses and power-relations)",
      "beingBecoming": "Becoming (social structures evolve historically)",
      "mindMatter": "Matter (material institutions shape thought)",
      "freedomDeterminism": "Determinism (social conditioning)",
      "transcendentImmanent": "Immanent (truths are context-bound)"
    }
  },
  {
    "name": "Niccolò Machiavelli",
    "birthYear": 1469,
    "deathYear": 1527,
    "domain": "Politics",
    "description": "Italian Renaissance political philosopher and statesman. In *The Prince* (1513), Machiavelli offered a pragmatic guide for rulers, arguing that the ends of securing power justify morally dubious means. He is often summarized as advising that it is better to be feared than loved. His work emphasizes the realities of political power rather than idealism.",
    "spiralStage": "Red",
    "classifications": {
      "oneMany": "Many (practical variables in politics)",
      "beingBecoming": "Becoming (change and strategy in statecraft)",
      "mindMatter": "Matter (realpolitik over ideology)",
      "freedomDeterminism": "Freedom (ruler’s choice in tactics)",
      "transcendentImmanent": "Immanent (focus on worldly power)"
    }
  },
  {
    "name": "Thomas Hobbes",
    "birthYear": 1588,
    "deathYear": 1679,
    "domain": "Politics",
    "description": "English philosopher, best known for *Leviathan* (1651). Hobbes argued that in a state of nature life is \"solitary, poor, nasty, brutish, and short\". To avoid this anarchy, he supported a strong sovereign (social contract) to ensure order. He was a materialist and an advocate of powerful government to prevent conflict.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "One (single sovereign state)",
      "beingBecoming": "Becoming (transition to civil order)",
      "mindMatter": "Matter (materialist psychology)",
      "freedomDeterminism": "Determinism (human fears drive compliance)",
      "transcendentImmanent": "Immanent (no divine authority needed)"
    }
  },
  {
    "name": "John Stuart Mill",
    "birthYear": 1806,
    "deathYear": 1873,
    "domain": "Ethics",
    "description": "English philosopher, economist, and social reformer. Mill was a leading utilitarian, author of *On Liberty* and *Utilitarianism*. He argued for the greatest happiness principle and for individual freedom (unless harm to others) as fundamental. He wrote that \"it is better to be a human being dissatisfied than a pig satisfied\", valuing intellectual and moral pleasures over mere sensual ones.",
    "spiralStage": "Green",
    "classifications": {
      "oneMany": "Many (diverse preferences)",
      "beingBecoming": "Becoming (societal progress)",
      "mindMatter": "Mind (emphasis on human values)",
      "freedomDeterminism": "Freedom (liberty and personal autonomy)",
      "transcendentImmanent": "Immanent (human-centered ethics)"
    }
  },
  {
    "name": "Epicurus",
    "birthYear": -341,
    "deathYear": -270,
    "domain": "Ethics",
    "description": "Greek philosopher and founder of Epicureanism. Epicurus taught that pleasure (understood as absence of pain) is the greatest good and advocated simple living and knowledge to attain tranquility. He was a materialist who believed in atoms and void. He famously wrote that \"death is nothing to us\" (since when we exist, death is not present) and valued friendship and moderation.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "Many (atoms and void)",
      "beingBecoming": "Becoming (atomic motion)",
      "mindMatter": "Matter (materialist worldview)",
      "freedomDeterminism": "Freedom (atomic \"swerve\" allows free will)",
      "transcendentImmanent": "Immanent (no divine concern)"
    }
  },
  {
    "name": "Zeno of Citium",
    "birthYear": -334,
    "deathYear": -262,
    "domain": "Ethics",
    "description": "Greek philosopher, founder of Stoicism. Zeno taught that virtue (living in agreement with nature) is the only good. He described the goal of life as \"living in agreement with nature,\" implying acceptance of what happens with equanimity. Stoicism emphasizes rational control of the passions and the unity of all in the divine Logos.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "Many (harmonious cosmos)",
      "beingBecoming": "Becoming (life’s unfolding)",
      "mindMatter": "Matter (nature and reason)",
      "freedomDeterminism": "Freedom (virtue within fate)",
      "transcendentImmanent": "Immanent (rational order in world)"
    }
  },
  {
    "name": "Avicenna (Ibn Sina)",
    "birthYear": 980,
    "deathYear": 1037,
    "domain": "Metaphysics",
    "description": "Persian polymath (doctor, philosopher). Avicenna synthesized Aristotelian philosophy with Islamic theology. He wrote *The Canon of Medicine* and major philosophical works. He argued for God as the necessary being and conceived the soul as separate from body. His metaphysical ideas, such as the floating man thought experiment, influenced medieval scholasticism.",
    "spiralStage": "Blue",
    "classifications": {
      "oneMany": "One (God as unified source)",
      "beingBecoming": "Being (God eternal)",
      "mindMatter": "Mind (immaterial soul emphasized)",
      "freedomDeterminism": "Determinism (divine will governs universe)",
      "transcendentImmanent": "Transcendent (God beyond world)"
    }
  },
  {
    "name": "Averroes (Ibn Rushd)",
    "birthYear": 1126,
    "deathYear": 1198,
    "domain": "Metaphysics",
    "description": "Andalusian philosopher and jurist known as \"The Commentator\" on Aristotle. Averroes wrote extensive commentaries on Aristotle and argued that reason and revelation ultimately agree. He proposed that truth can be reached by philosophy or religion, viewing the world as a rational order. His works influenced both Islamic and Christian scholasticism.",
    "spiralStage": "Orange",
    "classifications": {
      "oneMany": "Many (Aristotelian plural forms)",
      "beingBecoming": "Being (eternal truths in Nature)",
      "mindMatter": "Mind (emphasis on reason)",
      "freedomDeterminism": "Freedom (intellect liberates)",
      "transcendentImmanent": "Immanent (philosophy compatible with faith)"
    }
  }
];