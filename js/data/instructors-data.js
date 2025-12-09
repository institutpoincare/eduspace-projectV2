// Mock data for instructors with full CV information

const instructorsData = {
    ahmed: {
        id: 'ahmed',
        name: 'Ahmed Ben Ali',
        specialty: 'Expert DevOps & Cloud Computing',
        rating: 4.9,
        students: '15k+',
        badge: 'Top 1%',
        experience: '8 ans',
        price: '80 TND/h',
        image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Master en Informatique', school: 'INSAT', year: '2015' },
                { degree: 'Ingénieur DevOps', school: 'Polytechnique', year: '2013' }
            ],
            experience: [
                { title: 'Senior DevOps Engineer', company: 'Orange Tunisie', period: '2018-Present' },
                { title: 'Cloud Architect', company: 'Tunisie Telecom', period: '2015-2018' }
            ],
            skills: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Terraform'],
            certifications: ['AWS Certified Solutions Architect', 'Kubernetes Administrator'],
            languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    sarah: {
        id: 'sarah',
        name: 'Sarah M.',
        specialty: 'Design UX/UI & Créativité',
        rating: 5.0,
        students: '8k+',
        badge: 'Excellence',
        experience: '6 ans',
        price: '70 TND/h',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Master Design Graphique', school: 'ESAC Tunis', year: '2017' }
            ],
            experience: [
                { title: 'Lead UX Designer', company: 'Expensya', period: '2019-Present' },
                { title: 'UI/UX Designer', company: 'Sofrecom', period: '2017-2019' }
            ],
            skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'],
            certifications: ['Google UX Design Certificate', 'Nielsen Norman Group UX'],
            languages: ['Français (Natif)', 'Anglais (Courant)']
        }
    },
    leila: {
        id: 'leila',
        name: 'Leila K.',
        specialty: 'Marketing Digital & SEO',
        rating: 4.8,
        students: '12k+',
        badge: 'Vérifié',
        experience: '7 ans',
        price: '65 TND/h',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Master Marketing Digital', school: 'IHEC Carthage', year: '2016' }
            ],
            experience: [
                { title: 'Digital Marketing Manager', company: 'Jumia Tunisia', period: '2020-Present' },
                { title: 'SEO Specialist', company: 'Webhelp', period: '2016-2020' }
            ],
            skills: ['SEO', 'Google Ads', 'Facebook Ads', 'Analytics', 'Content Marketing'],
            certifications: ['Google Analytics Certified', 'HubSpot Inbound Marketing'],
            languages: ['Français (Natif)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    },
    karim: {
        id: 'karim',
        name: 'Karim S.',
        specialty: 'Développement Mobile iOS',
        rating: 4.7,
        students: '5k+',
        badge: 'Nouveau',
        experience: '5 ans',
        price: '75 TND/h',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        cv: {
            education: [
                { degree: 'Ingénieur Informatique', school: 'ESPRIT', year: '2018' }
            ],
            experience: [
                { title: 'iOS Developer', company: 'Vermeg', period: '2019-Present' },
                { title: 'Mobile Developer', company: 'Cynapsys', period: '2018-2019' }
            ],
            skills: ['Swift', 'SwiftUI', 'UIKit', 'Core Data', 'Firebase'],
            certifications: ['Apple Certified iOS Developer'],
            languages: ['Français (Courant)', 'Anglais (Courant)', 'Arabe (Natif)']
        }
    }
};
