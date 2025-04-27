import { db } from '../drizzle'
import { skillQuizzes } from '../schema/candidate'

export async function seedQuizzes() {
  console.log('Seeding sample skill quizzes...')

  const existingQuizzes = await db.select().from(skillQuizzes)
  const existingTitles = new Set(existingQuizzes.map((q) => q.title))

  const quizzesToInsert = [
    {
      title: 'JavaScript Fundamentals',
      description:
        'Assess basic to intermediate JavaScript skills, including syntax, arrays, objects, async patterns, and DOM manipulation.',
    },
    {
      title: 'React Basics',
      description:
        'Evaluate knowledge of React concepts like components, props, state, lifecycle methods, and hooks.',
    },
    {
      title: 'Node.js & Express',
      description:
        'Check familiarity with Node.js runtime and building REST APIs using Express, including middleware and routing.',
    },
    {
      title: 'HTML & CSS',
      description: 'Covers foundational web design, including semantic HTML and responsive CSS.',
    },
    {
      title: 'TypeScript Introduction',
      description:
        'Evaluate usage of TypeScript features like interfaces, types, generics, and compilation.',
    },
    {
      title: 'SQL & Database Basics',
      description:
        'Test knowledge of relational databases, SQL queries (SELECT, JOIN), and data modeling.',
    },
    {
      title: 'Data Structures & Algorithms',
      description:
        'Focus on complexity analysis, arrays, linked lists, trees, graphs, sorting, and searching algorithms.',
    },
    {
      title: 'Python Fundamentals',
      description:
        'Covers Python syntax, built-in data structures, and basic object-oriented programming.',
    },
    {
      title: 'Django Framework',
      description:
        "Evaluate knowledge of Django's MVT architecture, ORM usage, and template rendering.",
    },
    {
      title: 'RESTful API Design',
      description:
        'Covers designing RESTful endpoints, versioning, error handling, and best practices.',
    },
    {
      title: 'Machine Learning Basics',
      description:
        'Assess fundamental ML concepts, including supervised vs. unsupervised learning, regression, classification.',
    },
    {
      title: 'DevOps Fundamentals',
      description:
        'Evaluate knowledge of CI/CD pipelines, Docker, Kubernetes, and infrastructure as code basics.',
    },
    {
      title: 'AWS Cloud Practitioner',
      description:
        'Covers AWS core services, billing, cloud architecture, and security best practices.',
    },
    {
      title: 'Vue.js Essentials',
      description:
        'Check understanding of Vue.js single-file components, lifecycle hooks, and reactivity system.',
    },
    {
      title: 'Angular Basics',
      description:
        'Covers data binding, directives, dependency injection, and the component-based structure in Angular.',
    },
    {
      title: 'C# & .NET Fundamentals',
      description:
        'Evaluate basic C# syntax, .NET runtime concepts, and building console or web apps with .NET.',
    },
    {
      title: 'Ruby on Rails',
      description:
        'Test MVC understanding, Active Record queries, routing, and convention over configuration approach.',
    },
    {
      title: 'Golang Basics',
      description:
        'Covers Go syntax, concurrency with goroutines, channels, and basic error handling.',
    },
    {
      title: 'React Native',
      description:
        'Focus on using React Native for mobile development, including styling, navigation, and native modules.',
    },
    {
      title: 'Scrum & Agile Methodologies',
      description:
        'Non-coding quiz for agile principles, scrum ceremonies, roles, and backlog management.',
    },
  ]

  const newQuizzes = quizzesToInsert.filter((quiz) => !existingTitles.has(quiz.title))

  if (newQuizzes.length === 0) {
    console.log('All 20 sample quizzes already seeded. Skipping quiz seeding.')
    return
  }

  await db.insert(skillQuizzes).values(newQuizzes)
  console.log(
    'Sample quizzes seeded:',
    newQuizzes.map((q) => q.title),
  )
}
