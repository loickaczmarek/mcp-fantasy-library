-- Création des tables
CREATE TABLE livres (
                        id SERIAL PRIMARY KEY,
                        titre VARCHAR(100) NOT NULL,
                        auteur VARCHAR(100) NOT NULL,
                        isbn VARCHAR(20) UNIQUE,
                        description TEXT,
                        annee_publication INTEGER
);

CREATE TABLE clients (
                         id SERIAL PRIMARY KEY,
                         numero_identifiant VARCHAR(20) UNIQUE NOT NULL,
                         nom VARCHAR(50) NOT NULL,
                         prenom VARCHAR(50) NOT NULL,
                         email VARCHAR(100) UNIQUE,
                         date_inscription DATE DEFAULT CURRENT_DATE
);

CREATE TABLE emprunts (
                          id SERIAL PRIMARY KEY,
                          livre_id INTEGER REFERENCES livres(id) ON DELETE RESTRICT,
                          client_id INTEGER REFERENCES clients(id) ON DELETE RESTRICT,
                          date_emprunt DATE DEFAULT CURRENT_DATE,
                          date_retour_prevue DATE,
                          date_retour_effective DATE,
                          UNIQUE(livre_id, client_id, date_emprunt)
);

-- Insertion de 10 livres
INSERT INTO livres (titre, auteur, isbn, description, annee_publication) VALUES
                                                                             ('Le Petit Prince', 'Antoine de Saint-Exupéry', '978-2070612758', 'Un conte poétique et philosophique sous l''apparence d''un conte pour enfants', 1943),
                                                                             ('1984', 'George Orwell', '978-2070368228', 'Roman d''anticipation dystopique sur le totalitarisme', 1949),
                                                                             ('Notre-Dame de Paris', 'Victor Hugo', '978-2253096337', 'Roman historique se déroulant dans le Paris du XVe siècle', 1831),
                                                                             ('L''Étranger', 'Albert Camus', '978-2070360024', 'Roman existentialiste sur l''absurde', 1942),
                                                                             ('Les Misérables', 'Victor Hugo', '978-2253096344', 'Fresque sociale et politique du XIXe siècle', 1862),
                                                                             ('Voyage au centre de la Terre', 'Jules Verne', '978-2253012924', 'Roman d''aventures et de science-fiction', 1864),
                                                                             ('Madame Bovary', 'Gustave Flaubert', '978-2253004868', 'Roman réaliste sur l''adultère dans la France provinciale', 1857),
                                                                             ('Les Fourmis', 'Bernard Werber', '978-2253063339', 'Roman mêlant fantastique et science sur le monde des fourmis', 1991),
                                                                             ('Germinal', 'Émile Zola', '978-2253004226', 'Roman sur la condition ouvrière au XIXe siècle', 1885),
                                                                             ('Le Comte de Monte-Cristo', 'Alexandre Dumas', '978-2253098058', 'Roman d''aventures sur la vengeance et la rédemption', 1844);

-- Insertion de 5 clients
INSERT INTO clients (numero_identifiant, nom, prenom, email) VALUES
                                                                 ('CLI001', 'Dupont', 'Jean', 'jean.dupont@email.com'),
                                                                 ('CLI002', 'Martin', 'Sophie', 'sophie.martin@email.com'),
                                                                 ('CLI003', 'Dubois', 'Pierre', 'pierre.dubois@email.com'),
                                                                 ('CLI004', 'Petit', 'Marie', 'marie.petit@email.com'),
                                                                 ('CLI005', 'Robert', 'Lucas', 'lucas.robert@email.com');

-- Insertion de 2 emprunts
INSERT INTO emprunts (livre_id, client_id, date_emprunt, date_retour_prevue) VALUES
                                                                                 (1, 3, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days'),
                                                                                 (4, 2, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days');