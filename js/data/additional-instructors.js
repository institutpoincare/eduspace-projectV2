// Additional instructors data for expanded showcase (8 more instructors)

const additionalInstructorsData = {
    nadia: {
        id: 'nadia',
        name: 'Nadia Trabelsi',
        specialty: 'Data Science & IA',
        rating: 4.9,
        students: '10k+',
        badge: 'Expert IA',
        experience: '9 ans',
        price: '90 TND/h',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'PhD en Intelligence Artificielle', school: 'Paris-Saclay', year: '2016' },
                { degree: 'Master Data Science', school: 'INSAT', year: '2013' }
            ],
            experience: [
                { title: 'Lead Data Scientist', company: 'Telnet', period: '2020-Present' },
                { title: 'ML Engineer', company: 'Sofrecom', period: '2016-2020' }
            ],
            skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP'],
            certifications: ['Google ML Certificate', 'AWS ML Specialty'],
            languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    youssef: {
        id: 'youssef',
        name: 'Youssef Mansour',
        specialty: 'Cybersécurité & Ethical Hacking',
        rating: 4.8,
        students: '7k+',
        badge: 'Certifié CEH',
        experience: '7 ans',
        price: '85 TND/h',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Master Cybersécurité', school: 'SUP\'COM', year: '2016' }
            ],
            experience: [
                { title: 'Security Consultant', company: 'Ooredoo', period: '2019-Present' },
                { title: 'Pentester', company: 'CGI', period: '2016-2019' }
            ],
            skills: ['Penetration Testing', 'Network Security', 'Kali Linux', 'OSINT', 'Forensics'],
            certifications: ['CEH', 'OSCP', 'CompTIA Security+'],
            languages: ['Français (Courant)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    fatma: {
        id: 'fatma',
        name: 'Fatma Bouaziz',
        specialty: 'Développement Web Full Stack',
        rating: 4.7,
        students: '9k+',
        badge: 'Full Stack Pro',
        experience: '6 ans',
        price: '70 TND/h',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Ingénieur Informatique', school: 'ESPRIT', year: '2017' }
            ],
            experience: [
                { title: 'Full Stack Developer', company: 'Expensya', period: '2020-Present' },
                { title: 'Frontend Developer', company: 'Wevioo', period: '2017-2020' }
            ],
            skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Next.js', 'TypeScript'],
            certifications: ['Meta Frontend Developer', 'AWS Developer Associate'],
            languages: ['Français (Natif)', 'Anglais (Courant)']
        }
    },
    mehdi: {
        id: 'mehdi',
        name: 'Mehdi Gharbi',
        specialty: 'Blockchain & Crypto',
        rating: 4.6,
        students: '4k+',
        badge: 'Blockchain Expert',
        experience: '5 ans',
        price: '95 TND/h',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Master Cryptographie', school: 'ENIT', year: '2018' }
            ],
            experience: [
                { title: 'Blockchain Developer', company: 'Startup Crypto', period: '2019-Present' },
                { title: 'Smart Contract Developer', company: 'Freelance', period: '2018-2019' }
            ],
            skills: ['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'DeFi'],
            certifications: ['Certified Blockchain Developer', 'Ethereum Developer'],
            languages: ['Français (Courant)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    amira: {
        id: 'amira',
        name: 'Amira Slimani',
        specialty: 'Product Management & Agile',
        rating: 4.9,
        students: '6k+',
        badge: 'Scrum Master',
        experience: '8 ans',
        price: '75 TND/h',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'MBA', school: 'ISG Tunis', year: '2015' },
                { degree: 'Ingénieur Informatique', school: 'INSAT', year: '2013' }
            ],
            experience: [
                { title: 'Product Manager', company: 'Jumia', period: '2018-Present' },
                { title: 'Scrum Master', company: 'Sofrecom', period: '2015-2018' }
            ],
            skills: ['Agile', 'Scrum', 'Product Strategy', 'Jira', 'User Stories', 'Roadmapping'],
            certifications: ['Certified Scrum Master', 'Product Owner Certification'],
            languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    rami: {
        id: 'rami',
        name: 'Rami Jebali',
        specialty: 'Game Development & Unity',
        rating: 4.5,
        students: '3k+',
        badge: 'Game Dev',
        experience: '4 ans',
        price: '65 TND/h',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Ingénieur Multimédia', school: 'ISAMM', year: '2019' }
            ],
            experience: [
                { title: 'Unity Developer', company: 'Gaming Studio TN', period: '2020-Present' },
                { title: 'Junior Game Dev', company: 'Freelance', period: '2019-2020' }
            ],
            skills: ['Unity', 'C#', 'Unreal Engine', '3D Modeling', 'Game Design'],
            certifications: ['Unity Certified Developer'],
            languages: ['Français (Courant)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    sonia: {
        id: 'sonia',
        name: 'Sonia Hamdi',
        specialty: 'Content Marketing & Copywriting',
        rating: 4.8,
        students: '11k+',
        badge: 'Top Writer',
        experience: '7 ans',
        price: '60 TND/h',
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Master Communication', school: 'IPSI', year: '2016' }
            ],
            experience: [
                { title: 'Content Manager', company: 'Webhelp', period: '2019-Present' },
                { title: 'Copywriter', company: 'Agence Digitale', period: '2016-2019' }
            ],
            skills: ['Content Strategy', 'SEO Writing', 'Social Media', 'Storytelling', 'WordPress'],
            certifications: ['HubSpot Content Marketing', 'Google Digital Marketing'],
            languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    walid: {
        id: 'walid',
        name: 'Walid Bouzid',
        specialty: 'Architecture Logicielle & Microservices',
        rating: 4.9,
        students: '5k+',
        badge: 'Solution Architect',
        experience: '10 ans',
        price: '100 TND/h',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Ingénieur Informatique', school: 'ENSI', year: '2013' }
            ],
            experience: [
                { title: 'Solution Architect', company: 'Orange Tunisie', period: '2018-Present' },
                { title: 'Senior Developer', company: 'Vermeg', period: '2013-2018' }
            ],
            skills: ['Microservices', 'Spring Boot', 'Docker', 'Kubernetes', 'Architecture Patterns'],
            certifications: ['AWS Solutions Architect', 'Azure Solutions Architect'],
            languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    }
};
