// Canonical role list — no mongoose dependency so it's safe to import
// in Next.js "use client" components via placeprep-backend/src/constants/roles.
export const TARGET_ROLES = [
  'SDE-1', 'SDE-2', 'SDE-3',
  'Data Analyst', 'Product Manager',
  'DevOps', 'ML Engineer', 'QA',
] as const;

export type TargetRole = typeof TARGET_ROLES[number];

export interface RoleTopicItem {
  topicSlug: string;
  topicName: string;
  frequencyPct: number;
  questionCount: number;
  roundType?: string;
}

export const ROLE_FOCUS_DESCRIPTIONS: Record<string, string> = {
  'SDE-1': 'Core DSA, Problem Solving, OOP & DBMS Foundations',
  'SDE-2': 'System Design (HLD/LLD), Advanced DSA, Concurrency & Scalability',
  'SDE-3': 'Distributed Architecture, High Scale, Microservices & Leadership',
  'Data Analyst': 'Advanced SQL, Python / Pandas, Business Metrics & Statistics',
  'Product Manager': 'Product Sense, Strategy, Metrics, System Fluency & Leadership',
  'DevOps': 'CI/CD Pipelines, Kubernetes, Docker, Cloud & Observability',
  'ML Engineer': 'ML Algorithms, Deep Learning, MLOps, Pipelines & Math',
  'QA': 'Test Automation, API Testing, Performance & QA Strategy',
};

export const ROLE_DEFAULT_TOPICS: Record<string, RoleTopicItem[]> = {
  'SDE-1': [
    { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 25, questionCount: 15, roundType: 'Coding' },
    { topicSlug: 'dynamic-programming', topicName: 'Dynamic Programming', frequencyPct: 20, questionCount: 12, roundType: 'Coding' },
    { topicSlug: 'trees-graphs', topicName: 'Trees & Graphs', frequencyPct: 20, questionCount: 12, roundType: 'Coding' },
    { topicSlug: 'oops-clean-code', topicName: 'OOP & Clean Code', frequencyPct: 15, questionCount: 8, roundType: 'LLD' },
    { topicSlug: 'dbms-sql', topicName: 'DBMS & SQL', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
    { topicSlug: 'os-networking', topicName: 'OS & Computer Networks', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
  ],
  'SDE-2': [
    { topicSlug: 'system-design-hld', topicName: 'System Design (HLD)', frequencyPct: 25, questionCount: 15, roundType: 'System Design' },
    { topicSlug: 'low-level-design', topicName: 'Low-Level Design (LLD & Patterns)', frequencyPct: 20, questionCount: 12, roundType: 'LLD' },
    { topicSlug: 'advanced-dsa', topicName: 'Advanced DSA & Optimization', frequencyPct: 20, questionCount: 12, roundType: 'Coding' },
    { topicSlug: 'concurrency-multithreading', topicName: 'Concurrency & Multithreading', frequencyPct: 15, questionCount: 8, roundType: 'Coding' },
    { topicSlug: 'caching-databases', topicName: 'Caching & Scalable Databases', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
    { topicSlug: 'distributed-architecture', topicName: 'Distributed Architecture', frequencyPct: 10, questionCount: 6, roundType: 'System Design' },
  ],
  'SDE-3': [
    { topicSlug: 'distributed-systems', topicName: 'Distributed Systems & Scalability', frequencyPct: 25, questionCount: 15, roundType: 'System Design' },
    { topicSlug: 'microservices-messaging', topicName: 'Microservices & Event Streaming', frequencyPct: 20, questionCount: 12, roundType: 'System Design' },
    { topicSlug: 'system-reliability', topicName: 'High Availability & Fault Tolerance', frequencyPct: 20, questionCount: 12, roundType: 'System Design' },
    { topicSlug: 'cloud-security', topicName: 'Cloud Security & Governance', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'engineering-leadership', topicName: 'Engineering Leadership & Tradeoffs', frequencyPct: 10, questionCount: 6, roundType: 'HR' },
    { topicSlug: 'advanced-hld', topicName: 'Complex Large-Scale Architecture', frequencyPct: 10, questionCount: 6, roundType: 'System Design' },
  ],
  'Data Analyst': [
    { topicSlug: 'sql-queries', topicName: 'Advanced SQL & Query Optimization', frequencyPct: 30, questionCount: 18, roundType: 'Domain' },
    { topicSlug: 'python-pandas', topicName: 'Python & Data Wrangling (Pandas)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'statistics-probability', topicName: 'Statistics & Probability', frequencyPct: 20, questionCount: 10, roundType: 'Aptitude' },
    { topicSlug: 'bi-visualization', topicName: 'Data Visualization & Dashboards', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'metrics-kpis', topicName: 'Business Metrics & KPI Analysis', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
  ],
  'Product Manager': [
    { topicSlug: 'product-design-sense', topicName: 'Product Sense & Feature Design', frequencyPct: 30, questionCount: 18, roundType: 'Domain' },
    { topicSlug: 'metrics-ab-testing', topicName: 'Metrics, KPIs & A/B Testing', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'product-strategy-gtm', topicName: 'Product Strategy & GTM Planning', frequencyPct: 20, questionCount: 10, roundType: 'Domain' },
    { topicSlug: 'tech-fluency-architecture', topicName: 'Tech Fluency & System Architecture', frequencyPct: 15, questionCount: 8, roundType: 'System Design' },
    { topicSlug: 'behavioral-leadership', topicName: 'Stakeholder Alignment & Leadership', frequencyPct: 10, questionCount: 6, roundType: 'HR' },
  ],
  'DevOps': [
    { topicSlug: 'cicd-automation', topicName: 'CI/CD Pipelines & Automation', frequencyPct: 25, questionCount: 15, roundType: 'Domain' },
    { topicSlug: 'docker-kubernetes', topicName: 'Containers & Kubernetes (K8s)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'cloud-iac', topicName: 'Cloud Platforms & IaC (AWS/Terraform)', frequencyPct: 20, questionCount: 10, roundType: 'Domain' },
    { topicSlug: 'linux-scripting', topicName: 'Linux Administration & Shell Scripting', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'monitoring-observability', topicName: 'Observability & Monitoring', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
  ],
  'ML Engineer': [
    { topicSlug: 'ml-algorithms', topicName: 'Machine Learning Algorithms & Modeling', frequencyPct: 25, questionCount: 15, roundType: 'Domain' },
    { topicSlug: 'deep-learning', topicName: 'Deep Learning (PyTorch / TensorFlow)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'mlops-deployment', topicName: 'MLOps, Model Serving & Deployment', frequencyPct: 20, questionCount: 10, roundType: 'Domain' },
    { topicSlug: 'math-statistics', topicName: 'Math, Linear Algebra & Probability', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'data-pipelines-nlp-cv', topicName: 'Data Pipelines & Feature Engineering', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
  ],
  'QA': [
    { topicSlug: 'test-automation', topicName: 'Automation Testing (Selenium/Cypress)', frequencyPct: 30, questionCount: 18, roundType: 'Domain' },
    { topicSlug: 'api-testing', topicName: 'API Testing (Postman / REST Assured)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'manual-testing', topicName: 'Test Scenarios & Edge Cases', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'performance-testing', topicName: 'Performance & Load Testing (JMeter/k6)', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'cicd-qa-integration', topicName: 'CI/CD Test Pipelines & Bug Tracking', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
  ],
};
