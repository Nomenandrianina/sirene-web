import { DataSource } from 'typeorm';

export async function seedFokontanyVillage(dataSource: DataSource): Promise<void> {
 

    await dataSource.query(`
    INSERT INTO fokontany (name, commune_id) VALUES
 
      -- Antananarivo Renivohitra
      ('Analakely',             (SELECT id FROM communes WHERE name = 'Antananarivo Renivohitra')),
      ('Antaninarenina',        (SELECT id FROM communes WHERE name = 'Antananarivo Renivohitra')),
      ('Isotry',                (SELECT id FROM communes WHERE name = 'Antananarivo Renivohitra')),
      ('Ambondrona',            (SELECT id FROM communes WHERE name = 'Antananarivo Renivohitra')),
      ('Anatihazo',             (SELECT id FROM communes WHERE name = 'Antananarivo Renivohitra')),
 
      -- Ambohimangakely
      ('Ambohimangakely Centre',(SELECT id FROM communes WHERE name = 'Ambohimangakely')),
      ('Ankadindramamy',        (SELECT id FROM communes WHERE name = 'Ambohimangakely')),
      ('Ambohitrarahaba',       (SELECT id FROM communes WHERE name = 'Ambohimangakely')),
 
      -- Ambohimanambola
      ('Ambohimanambola Centre',(SELECT id FROM communes WHERE name = 'Ambohimanambola')),
      ('Andranomena',           (SELECT id FROM communes WHERE name = 'Ambohimanambola')),
      ('Morarano',              (SELECT id FROM communes WHERE name = 'Ambohimanambola')),
 
      -- Ambohimiadana
      ('Ambohimiadana Centre',  (SELECT id FROM communes WHERE name = 'Ambohimiadana')),
      ('Ankadifotsy',           (SELECT id FROM communes WHERE name = 'Ambohimiadana')),
      ('Ambodivona',            (SELECT id FROM communes WHERE name = 'Ambohimiadana')),
 
      -- Ambohitrimanjaka
      ('Ambohitrimanjaka Centre',(SELECT id FROM communes WHERE name = 'Ambohitrimanjaka')),
      ('Ankadimanga',           (SELECT id FROM communes WHERE name = 'Ambohitrimanjaka')),
      ('Ambohibao',             (SELECT id FROM communes WHERE name = 'Ambohitrimanjaka')),
 
      -- Ankadikely Ilafy
      ('Ankadikely Centre',     (SELECT id FROM communes WHERE name = 'Ankadikely Ilafy')),
      ('Ilafy',                 (SELECT id FROM communes WHERE name = 'Ankadikely Ilafy')),
      ('Ambodimanga Ilafy',     (SELECT id FROM communes WHERE name = 'Ankadikely Ilafy')),
 
      -- Sabotsy Namehana
      ('Sabotsy',               (SELECT id FROM communes WHERE name = 'Sabotsy Namehana')),
      ('Namehana',              (SELECT id FROM communes WHERE name = 'Sabotsy Namehana')),
      ('Ambatomitsangana',      (SELECT id FROM communes WHERE name = 'Sabotsy Namehana')),
 
      -- Masindray
      ('Masindray Centre',      (SELECT id FROM communes WHERE name = 'Masindray')),
      ('Ambohitrinilahy',       (SELECT id FROM communes WHERE name = 'Masindray')),
      ('Ampijoha',              (SELECT id FROM communes WHERE name = 'Masindray')),
 
      -- Manandriana Avaradrano
      ('Manandriana Centre',    (SELECT id FROM communes WHERE name = 'Manandriana Avaradrano')),
      ('Ambatofotsy',           (SELECT id FROM communes WHERE name = 'Manandriana Avaradrano')),
      ('Andranovelona',         (SELECT id FROM communes WHERE name = 'Manandriana Avaradrano')),
 
      -- Ambohidrapeto
      ('Ambohidrapeto Centre',  (SELECT id FROM communes WHERE name = 'Ambohidrapeto')),
      ('Tsimahafotsy',          (SELECT id FROM communes WHERE name = 'Ambohidrapeto')),
      ('Mahatazana',            (SELECT id FROM communes WHERE name = 'Ambohidrapeto')),
 
      -- Ambohijanaka
      ('Ambohijanaka Centre',   (SELECT id FROM communes WHERE name = 'Ambohijanaka')),
      ('Andranonahoatra',       (SELECT id FROM communes WHERE name = 'Ambohijanaka')),
      ('Andohatapenaka',        (SELECT id FROM communes WHERE name = 'Ambohijanaka')),
 
      -- Ampahitrosy
      ('Ampahitrosy Centre',    (SELECT id FROM communes WHERE name = 'Ampahitrosy')),
      ('Moramanga Atsimondrano',(SELECT id FROM communes WHERE name = 'Ampahitrosy')),
      ('Mandrosoa',             (SELECT id FROM communes WHERE name = 'Ampahitrosy')),
 
      -- Andranonahoatra
      ('Andranonahoatra Centre',(SELECT id FROM communes WHERE name = 'Andranonahoatra')),
      ('Ambodivato',            (SELECT id FROM communes WHERE name = 'Andranonahoatra')),
      ('Tsaramasay',            (SELECT id FROM communes WHERE name = 'Andranonahoatra')),
 
      -- Anosizato
      ('Anosizato Andrefana',   (SELECT id FROM communes WHERE name = 'Anosizato')),
      ('Anosizato Atsinanana',  (SELECT id FROM communes WHERE name = 'Anosizato')),
      ('Tsarahonenana',         (SELECT id FROM communes WHERE name = 'Anosizato')),
 
      -- Fenoarivo Atsimondrano
      ('Fenoarivo Centre',      (SELECT id FROM communes WHERE name = 'Fenoarivo Atsimondrano')),
      ('Ambatomirahavavy',      (SELECT id FROM communes WHERE name = 'Fenoarivo Atsimondrano')),
      ('Ankiabe',               (SELECT id FROM communes WHERE name = 'Fenoarivo Atsimondrano')),
 
      -- Itaosy
      ('Itaosy Centre',         (SELECT id FROM communes WHERE name = 'Itaosy')),
      ('Ambohitrambo',          (SELECT id FROM communes WHERE name = 'Itaosy')),
      ('Soavimbahoaka',         (SELECT id FROM communes WHERE name = 'Itaosy')),
 
      -- Ivato
      ('Ivato Aéroport',        (SELECT id FROM communes WHERE name = 'Ivato')),
      ('Ivato Centre',          (SELECT id FROM communes WHERE name = 'Ivato')),
      ('Ambohipihaonana Ivato', (SELECT id FROM communes WHERE name = 'Ivato')),
 
      -- Soalandy
      ('Soalandy Centre',       (SELECT id FROM communes WHERE name = 'Soalandy')),
      ('Andavamamba',           (SELECT id FROM communes WHERE name = 'Soalandy')),
      ('Manarintsoa',           (SELECT id FROM communes WHERE name = 'Soalandy')),
 
      -- Tanjombato
      ('Tanjombato Centre',     (SELECT id FROM communes WHERE name = 'Tanjombato')),
      ('Ankadifotsy Tanjombato',(SELECT id FROM communes WHERE name = 'Tanjombato')),
      ('Ambolokandrina',        (SELECT id FROM communes WHERE name = 'Tanjombato')),
 
      -- Bemasoandro
      ('Bemasoandro Centre',    (SELECT id FROM communes WHERE name = 'Bemasoandro')),
      ('Ampitatafika',          (SELECT id FROM communes WHERE name = 'Bemasoandro')),
      ('Ambaniala',             (SELECT id FROM communes WHERE name = 'Bemasoandro')),
 
      -- Alakamisy Fenoarivo
      ('Alakamisy Centre',      (SELECT id FROM communes WHERE name = 'Alakamisy Fenoarivo')),
      ('Ambohimanatrika',       (SELECT id FROM communes WHERE name = 'Alakamisy Fenoarivo')),
      ('Tsarafaritra',          (SELECT id FROM communes WHERE name = 'Alakamisy Fenoarivo')),
 
      -- Ambohidratrimo
      ('Ambohidratrimo Centre', (SELECT id FROM communes WHERE name = 'Ambohidratrimo')),
      ('Ambohimasina',          (SELECT id FROM communes WHERE name = 'Ambohidratrimo')),
      ('Antanetibe',            (SELECT id FROM communes WHERE name = 'Ambohidratrimo')),
 
      -- Ambohipihaonana
      ('Ambohipihaonana Centre',(SELECT id FROM communes WHERE name = 'Ambohipihaonana')),
      ('Ankadimbahoaka',        (SELECT id FROM communes WHERE name = 'Ambohipihaonana')),
      ('Tsaratanety',           (SELECT id FROM communes WHERE name = 'Ambohipihaonana')),
 
      -- Anosiala
      ('Anosiala Centre',       (SELECT id FROM communes WHERE name = 'Anosiala')),
      ('Ambohibao Anosiala',    (SELECT id FROM communes WHERE name = 'Anosiala')),
      ('Ambohimarina',          (SELECT id FROM communes WHERE name = 'Anosiala')),
 
      -- Fieferana
      ('Fieferana Centre',      (SELECT id FROM communes WHERE name = 'Fieferana')),
      ('Ambatofaho',            (SELECT id FROM communes WHERE name = 'Fieferana')),
      ('Ankafotra',             (SELECT id FROM communes WHERE name = 'Fieferana')),
 
      -- Mahabo Mananivo
      ('Mahabo Centre',         (SELECT id FROM communes WHERE name = 'Mahabo Mananivo')),
      ('Mananivo',              (SELECT id FROM communes WHERE name = 'Mahabo Mananivo')),
      ('Ambohibary',            (SELECT id FROM communes WHERE name = 'Mahabo Mananivo')),
 
      -- Andranovelona
      ('Andranovelona Centre',  (SELECT id FROM communes WHERE name = 'Andranovelona')),
      ('Ambodimangakely',       (SELECT id FROM communes WHERE name = 'Andranovelona')),
      ('Ankadimanga Avaratra',  (SELECT id FROM communes WHERE name = 'Andranovelona')),
 
      -- Ankazobe
      ('Ankazobe Centre',       (SELECT id FROM communes WHERE name = 'Ankazobe')),
      ('Amboaboa',              (SELECT id FROM communes WHERE name = 'Ankazobe')),
      ('Mahavelona Avaratra',   (SELECT id FROM communes WHERE name = 'Ankazobe')),
 
      -- Kiangara
      ('Kiangara Centre',       (SELECT id FROM communes WHERE name = 'Kiangara')),
      ('Ambohipihaonana Kiangara',(SELECT id FROM communes WHERE name = 'Kiangara')),
      ('Ambohibola',            (SELECT id FROM communes WHERE name = 'Kiangara')),
 
      -- Mahavelona Ankazobe
      ('Mahavelona Centre',     (SELECT id FROM communes WHERE name = 'Mahavelona Ankazobe')),
      ('Ambohibory',            (SELECT id FROM communes WHERE name = 'Mahavelona Ankazobe')),
      ('Ambohitrinilahy Mah.',  (SELECT id FROM communes WHERE name = 'Mahavelona Ankazobe')),
 
      -- Fihaonana
      ('Fihaonana Centre',      (SELECT id FROM communes WHERE name = 'Fihaonana')),
      ('Ambohitromby',          (SELECT id FROM communes WHERE name = 'Fihaonana')),
      ('Tsarafaritra Fihaonana',(SELECT id FROM communes WHERE name = 'Fihaonana')),
 
      -- Manjakandriana
      ('Manjakandriana Centre', (SELECT id FROM communes WHERE name = 'Manjakandriana')),
      ('Ambohitrony',           (SELECT id FROM communes WHERE name = 'Manjakandriana')),
      ('Marotsiriry',           (SELECT id FROM communes WHERE name = 'Manjakandriana')),
 
      -- Ambatomanga
      ('Ambatomanga Centre',    (SELECT id FROM communes WHERE name = 'Ambatomanga')),
      ('Tsarafaritra Ambato',   (SELECT id FROM communes WHERE name = 'Ambatomanga')),
      ('Ambohimiera',           (SELECT id FROM communes WHERE name = 'Ambatomanga')),
 
      -- Andreba
      ('Andreba Centre',        (SELECT id FROM communes WHERE name = 'Andreba')),
      ('Ambatolahy',            (SELECT id FROM communes WHERE name = 'Andreba')),
      ('Ampasimadinika',        (SELECT id FROM communes WHERE name = 'Andreba')),
 
      -- Ranovao
      ('Ranovao Centre',        (SELECT id FROM communes WHERE name = 'Ranovao')),
      ('Antsampandrano',        (SELECT id FROM communes WHERE name = 'Ranovao')),
      ('Mangatany',             (SELECT id FROM communes WHERE name = 'Ranovao')),
 
      -- Antsirabe I
      ('Mahazoarivo',           (SELECT id FROM communes WHERE name = 'Antsirabe I')),
      ('Ambohimiarivo',         (SELECT id FROM communes WHERE name = 'Antsirabe I')),
      ('Tsarahonenana Antsirabe',(SELECT id FROM communes WHERE name = 'Antsirabe I')),
      ('Antsirabe Centre',      (SELECT id FROM communes WHERE name = 'Antsirabe I')),
      ('Ampandrotrarana',       (SELECT id FROM communes WHERE name = 'Antsirabe I')),
 
      -- Antsirabe II
      ('Antsirabe II Centre',   (SELECT id FROM communes WHERE name = 'Antsirabe II')),
      ('Ambohimanjaka',         (SELECT id FROM communes WHERE name = 'Antsirabe II')),
      ('Ambohibary Antsirabe',  (SELECT id FROM communes WHERE name = 'Antsirabe II')),
 
      -- Ambohimandroso
      ('Ambohimandroso Centre', (SELECT id FROM communes WHERE name = 'Ambohimandroso')),
      ('Antanetibe Vakinank.',  (SELECT id FROM communes WHERE name = 'Ambohimandroso')),
      ('Ampitatsimo',           (SELECT id FROM communes WHERE name = 'Ambohimandroso')),
 
      -- Andranomanelatra
      ('Andranomanelatra Centre',(SELECT id FROM communes WHERE name = 'Andranomanelatra')),
      ('Ambatomena',            (SELECT id FROM communes WHERE name = 'Andranomanelatra')),
      ('Ambohibary Andrano',    (SELECT id FROM communes WHERE name = 'Andranomanelatra')),
 
      -- Antanambao Antsirabe
      ('Antanambao Centre',     (SELECT id FROM communes WHERE name = 'Antanambao Antsirabe')),
      ('Amboaroy',              (SELECT id FROM communes WHERE name = 'Antanambao Antsirabe')),
      ('Ambohimasina Antsirabe',(SELECT id FROM communes WHERE name = 'Antanambao Antsirabe')),
 
      -- Vinaninony
      ('Vinaninony Centre',     (SELECT id FROM communes WHERE name = 'Vinaninony')),
      ('Sahafatra',             (SELECT id FROM communes WHERE name = 'Vinaninony')),
      ('Ambohibola Vakin.',     (SELECT id FROM communes WHERE name = 'Vinaninony')),
 
      -- Antanifotsy
      ('Antanifotsy Centre',    (SELECT id FROM communes WHERE name = 'Antanifotsy')),
      ('Ankazomiriotra',        (SELECT id FROM communes WHERE name = 'Antanifotsy')),
      ('Ambohimasina Antanif.', (SELECT id FROM communes WHERE name = 'Antanifotsy')),
 
      -- Ambatolampy
      ('Ambatolampy Centre',    (SELECT id FROM communes WHERE name = 'Ambatolampy')),
      ('Ambohibary Ambatolampy',(SELECT id FROM communes WHERE name = 'Ambatolampy')),
      ('Andranofito',           (SELECT id FROM communes WHERE name = 'Ambatolampy')),
 
      -- Ambatonikolahy
      ('Ambatonikolahy Centre', (SELECT id FROM communes WHERE name = 'Ambatonikolahy')),
      ('Mahazina',              (SELECT id FROM communes WHERE name = 'Ambatonikolahy')),
      ('Ambohipandrano',        (SELECT id FROM communes WHERE name = 'Ambatonikolahy')),
 
      -- Betafo
      ('Betafo Centre',         (SELECT id FROM communes WHERE name = 'Betafo')),
      ('Inanantonana',          (SELECT id FROM communes WHERE name = 'Betafo')),
      ('Ambohimasina Betafo',   (SELECT id FROM communes WHERE name = 'Betafo')),
 
      -- Alarobia Betafo
      ('Alarobia Centre',       (SELECT id FROM communes WHERE name = 'Alarobia Betafo')),
      ('Tsarahonenana Betafo',  (SELECT id FROM communes WHERE name = 'Alarobia Betafo')),
      ('Ambohibato',            (SELECT id FROM communes WHERE name = 'Alarobia Betafo')),
 
      -- Ramainandro
      ('Ramainandro Centre',    (SELECT id FROM communes WHERE name = 'Ramainandro')),
      ('Ambohimasina Ramaind.', (SELECT id FROM communes WHERE name = 'Ramainandro')),
      ('Ambohibary Betafo',     (SELECT id FROM communes WHERE name = 'Ramainandro')),
 
      -- Arivonimamo I
      ('Arivonimamo I Centre',  (SELECT id FROM communes WHERE name = 'Arivonimamo I')),
      ('Antanetibe Arivonimamo',(SELECT id FROM communes WHERE name = 'Arivonimamo I')),
      ('Ambohimarina Arivon.',  (SELECT id FROM communes WHERE name = 'Arivonimamo I')),
 
      -- Arivonimamo II
      ('Arivonimamo II Centre', (SELECT id FROM communes WHERE name = 'Arivonimamo II')),
      ('Ambohibola Itasy',      (SELECT id FROM communes WHERE name = 'Arivonimamo II')),
      ('Ambohibe',              (SELECT id FROM communes WHERE name = 'Arivonimamo II')),
 
      -- Miantso
      ('Miantso Centre',        (SELECT id FROM communes WHERE name = 'Miantso')),
      ('Ambohidava',            (SELECT id FROM communes WHERE name = 'Miantso')),
      ('Ambohibola Miantso',    (SELECT id FROM communes WHERE name = 'Miantso')),
 
      -- Miarinarivo I
      ('Miarinarivo Centre',    (SELECT id FROM communes WHERE name = 'Miarinarivo I')),
      ('Ambohitraivo',          (SELECT id FROM communes WHERE name = 'Miarinarivo I')),
      ('Ambohitrony Miar.',     (SELECT id FROM communes WHERE name = 'Miarinarivo I')),
 
      -- Miarinarivo II
      ('Miarinarivo II Centre', (SELECT id FROM communes WHERE name = 'Miarinarivo II')),
      ('Andranovelona Miar.',   (SELECT id FROM communes WHERE name = 'Miarinarivo II')),
      ('Ambohimarina Miar.',    (SELECT id FROM communes WHERE name = 'Miarinarivo II')),
 
      -- Tsiroanomandidy
      ('Tsiroanomandidy Centre',(SELECT id FROM communes WHERE name = 'Tsiroanomandidy')),
      ('Ambohitromby Tsiro.',   (SELECT id FROM communes WHERE name = 'Tsiroanomandidy')),
      ('Mahasolo',              (SELECT id FROM communes WHERE name = 'Tsiroanomandidy')),
 
      -- Bemahatazana
      ('Bemahatazana Centre',   (SELECT id FROM communes WHERE name = 'Bemahatazana')),
      ('Ambatomiady',           (SELECT id FROM communes WHERE name = 'Bemahatazana')),
      ('Ankisabe',              (SELECT id FROM communes WHERE name = 'Bemahatazana')),
 
      -- Fianarantsoa I
      ('Tanana Ambony',         (SELECT id FROM communes WHERE name = 'Fianarantsoa I')),
      ('Ambohimiangaly',        (SELECT id FROM communes WHERE name = 'Fianarantsoa I')),
      ('Ambalakely',            (SELECT id FROM communes WHERE name = 'Fianarantsoa I')),
      ('Ankofafa',              (SELECT id FROM communes WHERE name = 'Fianarantsoa I')),
      ('Tsianolondroa',         (SELECT id FROM communes WHERE name = 'Fianarantsoa I')),
 
      -- Fianarantsoa II
      ('Fianarantsoa II Centre',(SELECT id FROM communes WHERE name = 'Fianarantsoa II')),
      ('Ampitatafika Fiana.',   (SELECT id FROM communes WHERE name = 'Fianarantsoa II')),
      ('Andranovorivato',       (SELECT id FROM communes WHERE name = 'Fianarantsoa II')),
 
      -- Alakamisy Ambohimaha
      ('Alakamisy Centre Fiana',(SELECT id FROM communes WHERE name = 'Alakamisy Ambohimaha')),
      ('Ambohimaha',            (SELECT id FROM communes WHERE name = 'Alakamisy Ambohimaha')),
      ('Sahafosa',              (SELECT id FROM communes WHERE name = 'Alakamisy Ambohimaha')),
 
      -- Ambalavao
      ('Ambalavao Centre',      (SELECT id FROM communes WHERE name = 'Ambalavao')),
      ('Ambohimahamasina',      (SELECT id FROM communes WHERE name = 'Ambalavao')),
      ('Sendrisoa',             (SELECT id FROM communes WHERE name = 'Ambalavao')),
 
      -- Ambohimahasoa
      ('Ambohimahasoa Centre',  (SELECT id FROM communes WHERE name = 'Ambohimahasoa')),
      ('Camp Robin',            (SELECT id FROM communes WHERE name = 'Ambohimahasoa')),
      ('Anjoma Ambohimahasoa',  (SELECT id FROM communes WHERE name = 'Ambohimahasoa')),
 
      -- Amborompotsy
      ('Amborompotsy Centre',   (SELECT id FROM communes WHERE name = 'Amborompotsy')),
      ('Fenoarivo Atsim.',      (SELECT id FROM communes WHERE name = 'Amborompotsy')),
      ('Ambohimahamasina Amb.', (SELECT id FROM communes WHERE name = 'Amborompotsy')),
 
      -- Ambositra I
      ('Ambositra I Centre',    (SELECT id FROM communes WHERE name = 'Ambositra I')),
      ('Ambatofisaka',          (SELECT id FROM communes WHERE name = 'Ambositra I')),
      ('Mahazina Ambositra',    (SELECT id FROM communes WHERE name = 'Ambositra I')),
 
      -- Ambositra II
      ('Ambositra II Centre',   (SELECT id FROM communes WHERE name = 'Ambositra II')),
      ('Ambalamanasy',          (SELECT id FROM communes WHERE name = 'Ambositra II')),
      ('Anjoma Ramartina',      (SELECT id FROM communes WHERE name = 'Ambositra II')),
 
      -- Ambatomarina
      ('Ambatomarina Centre',   (SELECT id FROM communes WHERE name = 'Ambatomarina')),
      ('Andina',                (SELECT id FROM communes WHERE name = 'Ambatomarina')),
      ('Vohimarina',            (SELECT id FROM communes WHERE name = 'Ambatomarina')),
 
      -- Fandriana
      ('Fandriana Centre',      (SELECT id FROM communes WHERE name = 'Fandriana')),
      ('Ambohimahamasina Fan.', (SELECT id FROM communes WHERE name = 'Fandriana')),
      ('Mahazoarivo Fandriana', (SELECT id FROM communes WHERE name = 'Fandriana')),
 
      -- Alakamisy Itenina
      ('Alakamisy Itenina Ctr', (SELECT id FROM communes WHERE name = 'Alakamisy Itenina')),
      ('Itenina',               (SELECT id FROM communes WHERE name = 'Alakamisy Itenina')),
      ('Vohitromby',            (SELECT id FROM communes WHERE name = 'Alakamisy Itenina')),
 
      -- Manakara Atsimo
      ('Manakara Centre',       (SELECT id FROM communes WHERE name = 'Manakara Atsimo')),
      ('Ambila Lemaitso',       (SELECT id FROM communes WHERE name = 'Manakara Atsimo')),
      ('Vohimasy',              (SELECT id FROM communes WHERE name = 'Manakara Atsimo')),
 
      -- Bekatra
      ('Bekatra Centre',        (SELECT id FROM communes WHERE name = 'Bekatra')),
      ('Lokomby',               (SELECT id FROM communes WHERE name = 'Bekatra')),
      ('Maromiandra',           (SELECT id FROM communes WHERE name = 'Bekatra')),
 
      -- Vohimasina
      ('Vohimasina Centre',     (SELECT id FROM communes WHERE name = 'Vohimasina')),
      ('Mahabo Vohimasina',     (SELECT id FROM communes WHERE name = 'Vohimasina')),
      ('Ambohimahasoa Manak.',  (SELECT id FROM communes WHERE name = 'Vohimasina')),
 
      -- Mananjary
      ('Mananjary Centre',      (SELECT id FROM communes WHERE name = 'Mananjary')),
      ('Mahela',                (SELECT id FROM communes WHERE name = 'Mananjary')),
      ('Ambohitsara',           (SELECT id FROM communes WHERE name = 'Mananjary')),
 
      -- Ambohinihaonana
      ('Ambohinihaonana Centre',(SELECT id FROM communes WHERE name = 'Ambohinihaonana')),
      ('Marofototra',           (SELECT id FROM communes WHERE name = 'Ambohinihaonana')),
      ('Tsaravary',             (SELECT id FROM communes WHERE name = 'Ambohinihaonana')),
 
      -- Vohipeno
      ('Vohipeno Centre',       (SELECT id FROM communes WHERE name = 'Vohipeno')),
      ('Marofototra Vohipeno',  (SELECT id FROM communes WHERE name = 'Vohipeno')),
      ('Mahamaibe',             (SELECT id FROM communes WHERE name = 'Vohipeno')),
 
      -- Ihosy
      ('Ihosy Centre',          (SELECT id FROM communes WHERE name = 'Ihosy')),
      ('Ambatolahy Ihosy',      (SELECT id FROM communes WHERE name = 'Ihosy')),
      ('Ankaramena',            (SELECT id FROM communes WHERE name = 'Ihosy')),
 
      -- Ranohira
      ('Ranohira Centre',       (SELECT id FROM communes WHERE name = 'Ranohira')),
      ('Andranovory',           (SELECT id FROM communes WHERE name = 'Ranohira')),
      ('Ilakaka',               (SELECT id FROM communes WHERE name = 'Ranohira')),
 
      -- Farafangana
      ('Farafangana Centre',    (SELECT id FROM communes WHERE name = 'Farafangana')),
      ('Ambohigogo',            (SELECT id FROM communes WHERE name = 'Farafangana')),
      ('Mahabo Farafangana',    (SELECT id FROM communes WHERE name = 'Farafangana')),
 
      -- Vangaindrano
      ('Vangaindrano Centre',   (SELECT id FROM communes WHERE name = 'Vangaindrano')),
      ('Bevata',                (SELECT id FROM communes WHERE name = 'Vangaindrano')),
      ('Mahabo Vangaindrano',   (SELECT id FROM communes WHERE name = 'Vangaindrano')),
 
      -- Toamasina I
      ('Toamasina Tanana Ambony',(SELECT id FROM communes WHERE name = 'Toamasina I')),
      ('Ampasimadinika Toa.',   (SELECT id FROM communes WHERE name = 'Toamasina I')),
      ('Morarano Toamasina',    (SELECT id FROM communes WHERE name = 'Toamasina I')),
      ('Mangarivotra',          (SELECT id FROM communes WHERE name = 'Toamasina I')),
      ('Ambodirano Toamasina',  (SELECT id FROM communes WHERE name = 'Toamasina I')),
 
      -- Toamasina II
      ('Toamasina II Centre',   (SELECT id FROM communes WHERE name = 'Toamasina II')),
      ('Ambodiriana Toa.',      (SELECT id FROM communes WHERE name = 'Toamasina II')),
      ('Ambanivohitra',         (SELECT id FROM communes WHERE name = 'Toamasina II')),
 
      -- Ambodiriana
      ('Ambodiriana Centre',    (SELECT id FROM communes WHERE name = 'Ambodiriana')),
      ('Ambodiara',             (SELECT id FROM communes WHERE name = 'Ambodiriana')),
      ('Mahavelona Toa.',       (SELECT id FROM communes WHERE name = 'Ambodiriana')),
 
      -- Foulpointe
      ('Foulpointe Centre',     (SELECT id FROM communes WHERE name = 'Foulpointe')),
      ('Mahavelona Bord Mer',   (SELECT id FROM communes WHERE name = 'Foulpointe')),
      ('Ampasimadinika Foul.',  (SELECT id FROM communes WHERE name = 'Foulpointe')),
 
      -- Brickaville
      ('Brickaville Centre',    (SELECT id FROM communes WHERE name = 'Brickaville')),
      ('Ranomafana Est',        (SELECT id FROM communes WHERE name = 'Brickaville')),
      ('Andevoranto',           (SELECT id FROM communes WHERE name = 'Brickaville')),
 
      -- Ampasimbe Onibe
      ('Ampasimbe Centre',      (SELECT id FROM communes WHERE name = 'Ampasimbe Onibe')),
      ('Onibe',                 (SELECT id FROM communes WHERE name = 'Ampasimbe Onibe')),
      ('Sahamatevina',          (SELECT id FROM communes WHERE name = 'Ampasimbe Onibe')),
 
      -- Mahanoro
      ('Mahanoro Centre',       (SELECT id FROM communes WHERE name = 'Mahanoro')),
      ('Marofototra Mahanoro',  (SELECT id FROM communes WHERE name = 'Mahanoro')),
      ('Tsaramasoandro',        (SELECT id FROM communes WHERE name = 'Mahanoro')),
 
      -- Vatomandry
      ('Vatomandry Centre',     (SELECT id FROM communes WHERE name = 'Vatomandry')),
      ('Amboditavolo',          (SELECT id FROM communes WHERE name = 'Vatomandry')),
      ('Masomeloka',            (SELECT id FROM communes WHERE name = 'Vatomandry')),
 
      -- Ambatondrazaka
      ('Ambatondrazaka Centre', (SELECT id FROM communes WHERE name = 'Ambatondrazaka')),
      ('Antanimenabaka',        (SELECT id FROM communes WHERE name = 'Ambatondrazaka')),
      ('Amparihimaneva',        (SELECT id FROM communes WHERE name = 'Ambatondrazaka')),
 
      -- Amparafaravola
      ('Amparafaravola Centre', (SELECT id FROM communes WHERE name = 'Amparafaravola')),
      ('Ambodivelo',            (SELECT id FROM communes WHERE name = 'Amparafaravola')),
      ('Vohitrarivo',           (SELECT id FROM communes WHERE name = 'Amparafaravola')),
 
      -- Moramanga
      ('Moramanga Centre',      (SELECT id FROM communes WHERE name = 'Moramanga')),
      ('Ambatovola',            (SELECT id FROM communes WHERE name = 'Moramanga')),
      ('Andasibe',              (SELECT id FROM communes WHERE name = 'Moramanga')),
 
      -- Andilamena
      ('Andilamena Centre',     (SELECT id FROM communes WHERE name = 'Andilamena')),
      ('Marovitsika',           (SELECT id FROM communes WHERE name = 'Andilamena')),
      ('Ambodiamontana',        (SELECT id FROM communes WHERE name = 'Andilamena')),
 
      -- Mahajanga I
      ('Amborovy Mahajanga',    (SELECT id FROM communes WHERE name = 'Mahajanga I')),
      ('Mahabibo',              (SELECT id FROM communes WHERE name = 'Mahajanga I')),
      ('Tsararano',             (SELECT id FROM communes WHERE name = 'Mahajanga I')),
      ('Mahavoky Atsimo',       (SELECT id FROM communes WHERE name = 'Mahajanga I')),
      ('Antohamadinika Mah.',   (SELECT id FROM communes WHERE name = 'Mahajanga I')),
 
      -- Mahajanga II
      ('Mahajanga II Centre',   (SELECT id FROM communes WHERE name = 'Mahajanga II')),
      ('Mangarivotra Mah.',     (SELECT id FROM communes WHERE name = 'Mahajanga II')),
      ('Belobaka',              (SELECT id FROM communes WHERE name = 'Mahajanga II')),
 
      -- Amborovy
      ('Amborovy Centre',       (SELECT id FROM communes WHERE name = 'Amborovy')),
      ('Ankazomborona',         (SELECT id FROM communes WHERE name = 'Amborovy')),
      ('Katsepy',               (SELECT id FROM communes WHERE name = 'Amborovy')),
 
      -- Marovoay I
      ('Marovoay I Centre',     (SELECT id FROM communes WHERE name = 'Marovoay I')),
      ('Anjiamangirana',        (SELECT id FROM communes WHERE name = 'Marovoay I')),
      ('Tsaramandroso',         (SELECT id FROM communes WHERE name = 'Marovoay I')),
 
      -- Marovoay II
      ('Marovoay II Centre',    (SELECT id FROM communes WHERE name = 'Marovoay II')),
      ('Ambolomoty',            (SELECT id FROM communes WHERE name = 'Marovoay II')),
      ('Ambalakida',            (SELECT id FROM communes WHERE name = 'Marovoay II')),
 
      -- Antsohihy
      ('Antsohihy Centre',      (SELECT id FROM communes WHERE name = 'Antsohihy')),
      ('Anjiabe Antsohihy',     (SELECT id FROM communes WHERE name = 'Antsohihy')),
      ('Ambodimanga Antsohihy', (SELECT id FROM communes WHERE name = 'Antsohihy')),
 
      -- Mandritsara
      ('Mandritsara Centre',    (SELECT id FROM communes WHERE name = 'Mandritsara')),
      ('Antanandava',           (SELECT id FROM communes WHERE name = 'Mandritsara')),
      ('Ambodimanary',          (SELECT id FROM communes WHERE name = 'Mandritsara')),
 
      -- Befandriana Avaratra
      ('Befandriana Centre',    (SELECT id FROM communes WHERE name = 'Befandriana Avaratra')),
      ('Ankijabe',              (SELECT id FROM communes WHERE name = 'Befandriana Avaratra')),
      ('Marotandrano',          (SELECT id FROM communes WHERE name = 'Befandriana Avaratra')),
 
      -- Maevatanana I
      ('Maevatanana I Centre',  (SELECT id FROM communes WHERE name = 'Maevatanana I')),
      ('Ambatosoratra',         (SELECT id FROM communes WHERE name = 'Maevatanana I')),
      ('Andramy',               (SELECT id FROM communes WHERE name = 'Maevatanana I')),
 
      -- Maevatanana II
      ('Maevatanana II Centre', (SELECT id FROM communes WHERE name = 'Maevatanana II')),
      ('Bealanana',             (SELECT id FROM communes WHERE name = 'Maevatanana II')),
      ('Tsararano Maevatan.',   (SELECT id FROM communes WHERE name = 'Maevatanana II')),
 
      -- Tsaratanana
      ('Tsaratanana Centre',    (SELECT id FROM communes WHERE name = 'Tsaratanana')),
      ('Mangindrano',           (SELECT id FROM communes WHERE name = 'Tsaratanana')),
      ('Ambalanirana',          (SELECT id FROM communes WHERE name = 'Tsaratanana')),
 
      -- Maintirano
      ('Maintirano Centre',     (SELECT id FROM communes WHERE name = 'Maintirano')),
      ('Ambatomainty',          (SELECT id FROM communes WHERE name = 'Maintirano')),
      ('Bemamba',               (SELECT id FROM communes WHERE name = 'Maintirano')),
 
      -- Toliara I
      ('Toliara I Centre',      (SELECT id FROM communes WHERE name = 'Toliara I')),
      ('Mahavatse I',           (SELECT id FROM communes WHERE name = 'Toliara I')),
      ('Tsongobory',            (SELECT id FROM communes WHERE name = 'Toliara I')),
      ('Betania Toliara',       (SELECT id FROM communes WHERE name = 'Toliara I')),
      ('Mahavatse II',          (SELECT id FROM communes WHERE name = 'Toliara I')),
 
      -- Toliara II
      ('Toliara II Centre',     (SELECT id FROM communes WHERE name = 'Toliara II')),
      ('Ambolobe Toliara',      (SELECT id FROM communes WHERE name = 'Toliara II')),
      ('Maromiandra Toliara',   (SELECT id FROM communes WHERE name = 'Toliara II')),
 
      -- Ambolobe
      ('Ambolobe Centre',       (SELECT id FROM communes WHERE name = 'Ambolobe')),
      ('Andranovory Ambolobe',  (SELECT id FROM communes WHERE name = 'Ambolobe')),
      ('Befandriana Atsimo',    (SELECT id FROM communes WHERE name = 'Ambolobe')),
 
      -- Belalanda
      ('Belalanda Centre',      (SELECT id FROM communes WHERE name = 'Belalanda')),
      ('Ankililoaka',           (SELECT id FROM communes WHERE name = 'Belalanda')),
      ('Ambahikily',            (SELECT id FROM communes WHERE name = 'Belalanda')),
 
      -- Miary
      ('Miary Centre',          (SELECT id FROM communes WHERE name = 'Miary')),
      ('Beheloke',              (SELECT id FROM communes WHERE name = 'Miary')),
      ('Ambotsibotsike',        (SELECT id FROM communes WHERE name = 'Miary')),
 
      -- Betioky Atsimo
      ('Betioky Centre',        (SELECT id FROM communes WHERE name = 'Betioky Atsimo')),
      ('Ankazomanga',           (SELECT id FROM communes WHERE name = 'Betioky Atsimo')),
      ('Soahazo',               (SELECT id FROM communes WHERE name = 'Betioky Atsimo')),
 
      -- Ejeda
      ('Ejeda Centre',          (SELECT id FROM communes WHERE name = 'Ejeda')),
      ('Beahitse',              (SELECT id FROM communes WHERE name = 'Ejeda')),
      ('Maroarivo',             (SELECT id FROM communes WHERE name = 'Ejeda')),
 
      -- Ampanihy Ouest
      ('Ampanihy Centre',       (SELECT id FROM communes WHERE name = 'Ampanihy Ouest')),
      ('Androka',               (SELECT id FROM communes WHERE name = 'Ampanihy Ouest')),
      ('Beheloke Ampanihy',     (SELECT id FROM communes WHERE name = 'Ampanihy Ouest')),
 
      -- Sakaraha
      ('Sakaraha Centre',       (SELECT id FROM communes WHERE name = 'Sakaraha')),
      ('Ankazoabo Atsimo',      (SELECT id FROM communes WHERE name = 'Sakaraha')),
      ('Miary Sakaraha',        (SELECT id FROM communes WHERE name = 'Sakaraha')),
 
      -- Morombe
      ('Morombe Centre',        (SELECT id FROM communes WHERE name = 'Morombe')),
      ('Nosy Ambositra',        (SELECT id FROM communes WHERE name = 'Morombe')),
      ('Andranopasy',           (SELECT id FROM communes WHERE name = 'Morombe')),
 
      -- Ambovombe
      ('Ambovombe Centre',      (SELECT id FROM communes WHERE name = 'Ambovombe')),
      ('Efoetse',               (SELECT id FROM communes WHERE name = 'Ambovombe')),
      ('Ambarinandroka',        (SELECT id FROM communes WHERE name = 'Ambovombe')),
 
      -- Ambazoa
      ('Ambazoa Centre',        (SELECT id FROM communes WHERE name = 'Ambazoa')),
      ('Tranoroa',              (SELECT id FROM communes WHERE name = 'Ambazoa')),
      ('Maroalika',             (SELECT id FROM communes WHERE name = 'Ambazoa')),
 
      -- Bekily
      ('Bekily Centre',         (SELECT id FROM communes WHERE name = 'Bekily')),
      ('Vohimary',              (SELECT id FROM communes WHERE name = 'Bekily')),
      ('Antanimora',            (SELECT id FROM communes WHERE name = 'Bekily')),
 
      -- Tsihombe
      ('Tsihombe Centre',       (SELECT id FROM communes WHERE name = 'Tsihombe')),
      ('Faux Cap',              (SELECT id FROM communes WHERE name = 'Tsihombe')),
      ('Marovato',              (SELECT id FROM communes WHERE name = 'Tsihombe')),
 
      -- Taolagnaro
      ('Taolagnaro Centre',     (SELECT id FROM communes WHERE name = 'Taolagnaro')),
      ('Libanona',              (SELECT id FROM communes WHERE name = 'Taolagnaro')),
      ('Soanierana Taolagnaro', (SELECT id FROM communes WHERE name = 'Taolagnaro')),
 
      -- Ranopiso
      ('Ranopiso Centre',       (SELECT id FROM communes WHERE name = 'Ranopiso')),
      ('Mandabe Ranopiso',      (SELECT id FROM communes WHERE name = 'Ranopiso')),
      ('Maroantsiry',           (SELECT id FROM communes WHERE name = 'Ranopiso')),
 
      -- Amboasary Atsimo
      ('Amboasary Centre',      (SELECT id FROM communes WHERE name = 'Amboasary Atsimo')),
      ('Sampona',               (SELECT id FROM communes WHERE name = 'Amboasary Atsimo')),
      ('Elonty',                (SELECT id FROM communes WHERE name = 'Amboasary Atsimo')),
 
      -- Betroka
      ('Betroka Centre',        (SELECT id FROM communes WHERE name = 'Betroka')),
      ('Analamary',             (SELECT id FROM communes WHERE name = 'Betroka')),
      ('Iakora',                (SELECT id FROM communes WHERE name = 'Betroka')),
 
      -- Morondava
      ('Morondava Centre',      (SELECT id FROM communes WHERE name = 'Morondava')),
      ('Nosy Kely',             (SELECT id FROM communes WHERE name = 'Morondava')),
      ('Dabara',                (SELECT id FROM communes WHERE name = 'Morondava')),
 
      -- Belo sur Tsiribihina
      ('Belo Centre',           (SELECT id FROM communes WHERE name = 'Belo sur Tsiribihina')),
      ('Ankalalobe',            (SELECT id FROM communes WHERE name = 'Belo sur Tsiribihina')),
      ('Berevo',                (SELECT id FROM communes WHERE name = 'Belo sur Tsiribihina')),
 
      -- Miandrivazo
      ('Miandrivazo Centre',    (SELECT id FROM communes WHERE name = 'Miandrivazo')),
      ('Malaimbandy',           (SELECT id FROM communes WHERE name = 'Miandrivazo')),
      ('Ankondromena',          (SELECT id FROM communes WHERE name = 'Miandrivazo')),
 
      -- Antsiranana I
      ('Antsiranana I Centre',  (SELECT id FROM communes WHERE name = 'Antsiranana I')),
      ('Tanambao Antsiranana',  (SELECT id FROM communes WHERE name = 'Antsiranana I')),
      ('Joffre Ville',          (SELECT id FROM communes WHERE name = 'Antsiranana I')),
      ('Ankorika',              (SELECT id FROM communes WHERE name = 'Antsiranana I')),
      ('Ambatoharanana',        (SELECT id FROM communes WHERE name = 'Antsiranana I')),
 
      -- Antsiranana II
      ('Antsiranana II Centre', (SELECT id FROM communes WHERE name = 'Antsiranana II')),
      ('Anivorano Avaratra',    (SELECT id FROM communes WHERE name = 'Antsiranana II')),
      ('Mangaoka',              (SELECT id FROM communes WHERE name = 'Antsiranana II')),
 
      -- Ramena
      ('Ramena Centre',         (SELECT id FROM communes WHERE name = 'Ramena')),
      ('Sakalava Bay',          (SELECT id FROM communes WHERE name = 'Ramena')),
      ('Ankarea',               (SELECT id FROM communes WHERE name = 'Ramena')),
 
      -- Ambanja
      ('Ambanja Centre',        (SELECT id FROM communes WHERE name = 'Ambanja')),
      ('Bemanevika',            (SELECT id FROM communes WHERE name = 'Ambanja')),
      ('Maherivaratra',         (SELECT id FROM communes WHERE name = 'Ambanja')),
 
      -- Ambaliha
      ('Ambaliha Centre',       (SELECT id FROM communes WHERE name = 'Ambaliha')),
      ('Ankify',                (SELECT id FROM communes WHERE name = 'Ambaliha')),
      ('Ampondra',              (SELECT id FROM communes WHERE name = 'Ambaliha')),
 
      -- Ambilobe
      ('Ambilobe Centre',       (SELECT id FROM communes WHERE name = 'Ambilobe')),
      ('Mantaly',               (SELECT id FROM communes WHERE name = 'Ambilobe')),
      ('Ambakireny',            (SELECT id FROM communes WHERE name = 'Ambilobe')),
 
      -- Antsohimbondrona
      ('Antsohimbondrona Centre',(SELECT id FROM communes WHERE name = 'Antsohimbondrona')),
      ('Mosorolava',            (SELECT id FROM communes WHERE name = 'Antsohimbondrona')),
      ('Ampondrabe',            (SELECT id FROM communes WHERE name = 'Antsohimbondrona')),
 
      -- Nosy Be
      ('Hell-Ville',            (SELECT id FROM communes WHERE name = 'Nosy Be')),
      ('Dzamandzar',            (SELECT id FROM communes WHERE name = 'Nosy Be')),
      ('Ambatoloaka',           (SELECT id FROM communes WHERE name = 'Nosy Be')),
      ('Madirokely',            (SELECT id FROM communes WHERE name = 'Nosy Be')),
      ('Andilana',              (SELECT id FROM communes WHERE name = 'Nosy Be')),
 
      -- Sambava
      ('Sambava Centre',        (SELECT id FROM communes WHERE name = 'Sambava')),
      ('Anjangoveratra',        (SELECT id FROM communes WHERE name = 'Sambava')),
      ('Ambodivoanio',          (SELECT id FROM communes WHERE name = 'Sambava')),
 
      -- Andasibe Sambava
      ('Andasibe Centre Samba', (SELECT id FROM communes WHERE name = 'Andasibe Sambava')),
      ('Ambodiampana',          (SELECT id FROM communes WHERE name = 'Andasibe Sambava')),
      ('Marojala',              (SELECT id FROM communes WHERE name = 'Andasibe Sambava')),
 
      -- Antalaha
      ('Antalaha Centre',       (SELECT id FROM communes WHERE name = 'Antalaha')),
      ('Vinanivao',             (SELECT id FROM communes WHERE name = 'Antalaha')),
      ('Ampahana',              (SELECT id FROM communes WHERE name = 'Antalaha')),
 
      -- Andapa
      ('Andapa Centre',         (SELECT id FROM communes WHERE name = 'Andapa')),
      ('Antsahamena',           (SELECT id FROM communes WHERE name = 'Andapa')),
      ('Bealampona',            (SELECT id FROM communes WHERE name = 'Andapa')),
 
      -- Befingotra
      ('Befingotra Centre',     (SELECT id FROM communes WHERE name = 'Befingotra')),
      ('Marojala Andapa',       (SELECT id FROM communes WHERE name = 'Befingotra')),
      ('Amboangibe',            (SELECT id FROM communes WHERE name = 'Befingotra')),
 
      -- Vohemar
      ('Vohemar Centre',        (SELECT id FROM communes WHERE name = 'Vohemar')),
      ('Antsirabe Nord',        (SELECT id FROM communes WHERE name = 'Vohemar')),
      ('Ambolobozo',            (SELECT id FROM communes WHERE name = 'Vohemar')),
 
      -- Daraina
      ('Daraina Centre',        (SELECT id FROM communes WHERE name = 'Daraina')),
      ('Ampondra Daraina',      (SELECT id FROM communes WHERE name = 'Daraina')),
      ('Beangolo',              (SELECT id FROM communes WHERE name = 'Daraina'))
  `);
  console.log('✅ Fokontany seeded');
 
  // ── VILLAGES ─────────────────────────────────────────────────────────────────
  // Each village needs: name, latitude, longitude, province, region, district, commune, fokontany
  // Using approximate coordinates for real Malagasy villages

  await dataSource.query(`
    INSERT INTO villages (name, latitude, longitude, provinceId, regionId, districtId, communeid, fokontanyId)
    VALUES

      -- Analakely fokontany (Antananarivo Renivohitra)
      ('Analakely Ambony',    '-18.9140', '47.5351',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM communes  WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM fokontany WHERE name='Analakely' AND commune_id=(SELECT id FROM communes WHERE name='Antananarivo Renivohitra'))),
      ('Analakely Ambany',    '-18.9162', '47.5363',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM communes  WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM fokontany WHERE name='Analakely' AND commune_id=(SELECT id FROM communes WHERE name='Antananarivo Renivohitra'))),

      -- Antaninarenina
      ('Antaninarenina Avaratra','-18.9095','47.5364',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM communes  WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM fokontany WHERE name='Antaninarenina' AND commune_id=(SELECT id FROM communes WHERE name='Antananarivo Renivohitra'))),
      ('Antaninarenina Atsimo','-18.9108','47.5372',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM communes  WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM fokontany WHERE name='Antaninarenina' AND commune_id=(SELECT id FROM communes WHERE name='Antananarivo Renivohitra'))),

      -- Isotry
      ('Isotry Centre',       '-18.9201','47.5198',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM communes  WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM fokontany WHERE name='Isotry' AND commune_id=(SELECT id FROM communes WHERE name='Antananarivo Renivohitra'))),
      ('Isotry Ambany',       '-18.9218','47.5201',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM communes  WHERE name='Antananarivo Renivohitra'),
        (SELECT id FROM fokontany WHERE name='Isotry' AND commune_id=(SELECT id FROM communes WHERE name='Antananarivo Renivohitra'))),

      -- Ivato
      ('Ivato Aéroport Village','-18.7969','47.4786',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Atsimondrano'),
        (SELECT id FROM communes  WHERE name='Ivato'),
        (SELECT id FROM fokontany WHERE name='Ivato Aéroport' AND commune_id=(SELECT id FROM communes WHERE name='Ivato'))),
      ('Ivato Vokimasina',    '-18.8005','47.4801',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Atsimondrano'),
        (SELECT id FROM communes  WHERE name='Ivato'),
        (SELECT id FROM fokontany WHERE name='Ivato Aéroport' AND commune_id=(SELECT id FROM communes WHERE name='Ivato'))),

      -- Tanjombato
      ('Tanjombato Est',      '-18.9642','47.5354',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Atsimondrano'),
        (SELECT id FROM communes  WHERE name='Tanjombato'),
        (SELECT id FROM fokontany WHERE name='Tanjombato Centre' AND commune_id=(SELECT id FROM communes WHERE name='Tanjombato'))),
      ('Tanjombato Andrefana', '-18.9655','47.5338',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Analamanga'),
        (SELECT id FROM districts WHERE name='Antananarivo Atsimondrano'),
        (SELECT id FROM communes  WHERE name='Tanjombato'),
        (SELECT id FROM fokontany WHERE name='Tanjombato Centre' AND commune_id=(SELECT id FROM communes WHERE name='Tanjombato'))),

      -- Antsirabe I
      ('Antsirabe Ville',     '-19.8659','47.0358',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Vakinankaratra'),
        (SELECT id FROM districts WHERE name='Antsirabe I'),
        (SELECT id FROM communes  WHERE name='Antsirabe I'),
        (SELECT id FROM fokontany WHERE name='Antsirabe Centre' AND commune_id=(SELECT id FROM communes WHERE name='Antsirabe I'))),
      ('Antsirabe Nord',      '-19.8580','47.0338',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Vakinankaratra'),
        (SELECT id FROM districts WHERE name='Antsirabe I'),
        (SELECT id FROM communes  WHERE name='Antsirabe I'),
        (SELECT id FROM fokontany WHERE name='Mahazoarivo' AND commune_id=(SELECT id FROM communes WHERE name='Antsirabe I'))),

      -- Ambatolampy
      ('Ambatolampy Centre',  '-19.3833','47.4167',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Vakinankaratra'),
        (SELECT id FROM districts WHERE name='Antanifotsy'),
        (SELECT id FROM communes  WHERE name='Ambatolampy'),
        (SELECT id FROM fokontany WHERE name='Ambatolampy Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ambatolampy'))),
      ('Ambatolampy Atsimo',  '-19.3901','47.4201',
        (SELECT id FROM provinces WHERE name='Antananarivo'),
        (SELECT id FROM regions  WHERE name='Vakinankaratra'),
        (SELECT id FROM districts WHERE name='Antanifotsy'),
        (SELECT id FROM communes  WHERE name='Ambatolampy'),
        (SELECT id FROM fokontany WHERE name='Ambatolampy Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ambatolampy'))),

      -- Fianarantsoa I
      ('Tanana Ambony Village','-21.4545','47.0870',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Haute Matsiatra'),
        (SELECT id FROM districts WHERE name='Fianarantsoa I'),
        (SELECT id FROM communes  WHERE name='Fianarantsoa I'),
        (SELECT id FROM fokontany WHERE name='Tanana Ambony' AND commune_id=(SELECT id FROM communes WHERE name='Fianarantsoa I'))),
      ('Ambalakely Village',  '-21.4601','47.0891',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Haute Matsiatra'),
        (SELECT id FROM districts WHERE name='Fianarantsoa I'),
        (SELECT id FROM communes  WHERE name='Fianarantsoa I'),
        (SELECT id FROM fokontany WHERE name='Ambalakely' AND commune_id=(SELECT id FROM communes WHERE name='Fianarantsoa I'))),

      -- Ambositra I
      ('Ambositra Nord',      '-20.5271','47.2463',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Amoron''i Mania'),
        (SELECT id FROM districts WHERE name='Ambositra'),
        (SELECT id FROM communes  WHERE name='Ambositra I'),
        (SELECT id FROM fokontany WHERE name='Ambositra I Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ambositra I'))),
      ('Ambositra Atsimo',    '-20.5336','47.2481',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Amoron''i Mania'),
        (SELECT id FROM districts WHERE name='Ambositra'),
        (SELECT id FROM communes  WHERE name='Ambositra I'),
        (SELECT id FROM fokontany WHERE name='Ambositra I Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ambositra I'))),

      -- Manakara Atsimo
      ('Manakara Bord Mer',   '-22.1451','48.0113',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Vatovavy Fitovinany'),
        (SELECT id FROM districts WHERE name='Manakara'),
        (SELECT id FROM communes  WHERE name='Manakara Atsimo'),
        (SELECT id FROM fokontany WHERE name='Manakara Centre' AND commune_id=(SELECT id FROM communes WHERE name='Manakara Atsimo'))),
      ('Manakara Ambany',     '-22.1498','48.0143',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Vatovavy Fitovinany'),
        (SELECT id FROM districts WHERE name='Manakara'),
        (SELECT id FROM communes  WHERE name='Manakara Atsimo'),
        (SELECT id FROM fokontany WHERE name='Manakara Centre' AND commune_id=(SELECT id FROM communes WHERE name='Manakara Atsimo'))),

      -- Ihosy
      ('Ihosy Centre Village','-22.4024','46.1207',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Ihorombe'),
        (SELECT id FROM districts WHERE name='Ihosy'),
        (SELECT id FROM communes  WHERE name='Ihosy'),
        (SELECT id FROM fokontany WHERE name='Ihosy Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ihosy'))),
      ('Ihosy Avaratra',      '-22.3945','46.1168',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Ihorombe'),
        (SELECT id FROM districts WHERE name='Ihosy'),
        (SELECT id FROM communes  WHERE name='Ihosy'),
        (SELECT id FROM fokontany WHERE name='Ihosy Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ihosy'))),

      -- Toamasina I
      ('Toamasina Port',      '-18.1496','49.4023',
        (SELECT id FROM provinces WHERE name='Toamasina'),
        (SELECT id FROM regions  WHERE name='Atsinanana'),
        (SELECT id FROM districts WHERE name='Toamasina I'),
        (SELECT id FROM communes  WHERE name='Toamasina I'),
        (SELECT id FROM fokontany WHERE name='Mangarivotra' AND commune_id=(SELECT id FROM communes WHERE name='Toamasina I'))),
      ('Toamasina Ambony',    '-18.1421','49.3978',
        (SELECT id FROM provinces WHERE name='Toamasina'),
        (SELECT id FROM regions  WHERE name='Atsinanana'),
        (SELECT id FROM districts WHERE name='Toamasina I'),
        (SELECT id FROM communes  WHERE name='Toamasina I'),
        (SELECT id FROM fokontany WHERE name='Mangarivotra' AND commune_id=(SELECT id FROM communes WHERE name='Toamasina I'))),

      -- Moramanga
      ('Moramanga Est',       '-18.9401','48.2251',
        (SELECT id FROM provinces WHERE name='Toamasina'),
        (SELECT id FROM regions  WHERE name='Alaotra Mangoro'),
        (SELECT id FROM districts WHERE name='Moramanga'),
        (SELECT id FROM communes  WHERE name='Moramanga'),
        (SELECT id FROM fokontany WHERE name='Moramanga Centre' AND commune_id=(SELECT id FROM communes WHERE name='Moramanga'))),
      ('Andasibe Village',    '-18.9321','48.4105',
        (SELECT id FROM provinces WHERE name='Toamasina'),
        (SELECT id FROM regions  WHERE name='Alaotra Mangoro'),
        (SELECT id FROM districts WHERE name='Moramanga'),
        (SELECT id FROM communes  WHERE name='Moramanga'),
        (SELECT id FROM fokontany WHERE name='Andasibe' AND commune_id=(SELECT id FROM communes WHERE name='Moramanga'))),

      -- Mahajanga I
      ('Mahajanga Tsararano',  '-15.7167','46.3167',
        (SELECT id FROM provinces WHERE name='Mahajanga'),
        (SELECT id FROM regions  WHERE name='Boeny'),
        (SELECT id FROM districts WHERE name='Mahajanga I'),
        (SELECT id FROM communes  WHERE name='Mahajanga I'),
        (SELECT id FROM fokontany WHERE name='Tsararano' AND commune_id=(SELECT id FROM communes WHERE name='Mahajanga I'))),
      ('Mahajanga Mahabibo',   '-15.7212','46.3189',
        (SELECT id FROM provinces WHERE name='Mahajanga'),
        (SELECT id FROM regions  WHERE name='Boeny'),
        (SELECT id FROM districts WHERE name='Mahajanga I'),
        (SELECT id FROM communes  WHERE name='Mahajanga I'),
        (SELECT id FROM fokontany WHERE name='Mahabibo' AND commune_id=(SELECT id FROM communes WHERE name='Mahajanga I'))),

      -- Toliara I
      ('Toliara Mahavatse',    '-23.3516','43.6854',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Atsimo Andrefana'),
        (SELECT id FROM districts WHERE name='Toliara I'),
        (SELECT id FROM communes  WHERE name='Toliara I'),
        (SELECT id FROM fokontany WHERE name='Mahavatse I' AND commune_id=(SELECT id FROM communes WHERE name='Toliara I'))),
      ('Toliara Betania',      '-23.3559','43.6901',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Atsimo Andrefana'),
        (SELECT id FROM districts WHERE name='Toliara I'),
        (SELECT id FROM communes  WHERE name='Toliara I'),
        (SELECT id FROM fokontany WHERE name='Betania Toliara' AND commune_id=(SELECT id FROM communes WHERE name='Toliara I'))),

      -- Antsiranana I
      ('Diego-Suarez Centre',  '-12.3548','49.2944',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Diana'),
        (SELECT id FROM districts WHERE name='Antsiranana I'),
        (SELECT id FROM communes  WHERE name='Antsiranana I'),
        (SELECT id FROM fokontany WHERE name='Antsiranana I Centre' AND commune_id=(SELECT id FROM communes WHERE name='Antsiranana I'))),
      ('Joffre Ville Village', '-12.3612','49.3011',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Diana'),
        (SELECT id FROM districts WHERE name='Antsiranana I'),
        (SELECT id FROM communes  WHERE name='Antsiranana I'),
        (SELECT id FROM fokontany WHERE name='Joffre Ville' AND commune_id=(SELECT id FROM communes WHERE name='Antsiranana I'))),

      -- Nosy Be
      ('Hell-Ville Centre',    '-13.4076','48.2717',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Diana'),
        (SELECT id FROM districts WHERE name='Nosy Be'),
        (SELECT id FROM communes  WHERE name='Nosy Be'),
        (SELECT id FROM fokontany WHERE name='Hell-Ville' AND commune_id=(SELECT id FROM communes WHERE name='Nosy Be'))),
      ('Ambatoloaka Village',  '-13.4219','48.2651',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Diana'),
        (SELECT id FROM districts WHERE name='Nosy Be'),
        (SELECT id FROM communes  WHERE name='Nosy Be'),
        (SELECT id FROM fokontany WHERE name='Ambatoloaka' AND commune_id=(SELECT id FROM communes WHERE name='Nosy Be'))),

      -- Sambava
      ('Sambava Centre Village','-14.2681','50.1679',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Sava'),
        (SELECT id FROM districts WHERE name='Sambava'),
        (SELECT id FROM communes  WHERE name='Sambava'),
        (SELECT id FROM fokontany WHERE name='Sambava Centre' AND commune_id=(SELECT id FROM communes WHERE name='Sambava'))),
      ('Sambava Bord Mer',     '-14.2721','50.1712',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Sava'),
        (SELECT id FROM districts WHERE name='Sambava'),
        (SELECT id FROM communes  WHERE name='Sambava'),
        (SELECT id FROM fokontany WHERE name='Sambava Centre' AND commune_id=(SELECT id FROM communes WHERE name='Sambava'))),

      -- Antalaha
      ('Antalaha Centre Village','-14.8964','50.2745',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Sava'),
        (SELECT id FROM districts WHERE name='Antalaha'),
        (SELECT id FROM communes  WHERE name='Antalaha'),
        (SELECT id FROM fokontany WHERE name='Antalaha Centre' AND commune_id=(SELECT id FROM communes WHERE name='Antalaha'))),
      ('Vinanivao Village',    '-14.9012','50.2801',
        (SELECT id FROM provinces WHERE name='Antsiranana'),
        (SELECT id FROM regions  WHERE name='Sava'),
        (SELECT id FROM districts WHERE name='Antalaha'),
        (SELECT id FROM communes  WHERE name='Antalaha'),
        (SELECT id FROM fokontany WHERE name='Vinanivao' AND commune_id=(SELECT id FROM communes WHERE name='Antalaha'))),

      -- Morondava
      ('Morondava Centre Ville','-20.2842','44.2784',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Menabe'),
        (SELECT id FROM districts WHERE name='Morondava'),
        (SELECT id FROM communes  WHERE name='Morondava'),
        (SELECT id FROM fokontany WHERE name='Morondava Centre' AND commune_id=(SELECT id FROM communes WHERE name='Morondava'))),
      ('Nosy Kely Village',    '-20.2908','44.2741',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Menabe'),
        (SELECT id FROM districts WHERE name='Morondava'),
        (SELECT id FROM communes  WHERE name='Morondava'),
        (SELECT id FROM fokontany WHERE name='Nosy Kely' AND commune_id=(SELECT id FROM communes WHERE name='Morondava'))),

      -- Taolagnaro
      ('Taolagnaro Centre',    '-25.0312','46.9821',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Anosy'),
        (SELECT id FROM districts WHERE name='Taolagnaro'),
        (SELECT id FROM communes  WHERE name='Taolagnaro'),
        (SELECT id FROM fokontany WHERE name='Taolagnaro Centre' AND commune_id=(SELECT id FROM communes WHERE name='Taolagnaro'))),
      ('Libanona Village',     '-25.0379','46.9874',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Anosy'),
        (SELECT id FROM districts WHERE name='Taolagnaro'),
        (SELECT id FROM communes  WHERE name='Taolagnaro'),
        (SELECT id FROM fokontany WHERE name='Libanona' AND commune_id=(SELECT id FROM communes WHERE name='Taolagnaro'))),

      -- Ambovombe
      ('Ambovombe Centre Village','-25.1756','46.0859',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Androy'),
        (SELECT id FROM districts WHERE name='Ambovombe'),
        (SELECT id FROM communes  WHERE name='Ambovombe'),
        (SELECT id FROM fokontany WHERE name='Ambovombe Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ambovombe'))),
      ('Efoetse Village',      '-25.1834','46.0901',
        (SELECT id FROM provinces WHERE name='Toliara'),
        (SELECT id FROM regions  WHERE name='Androy'),
        (SELECT id FROM districts WHERE name='Ambovombe'),
        (SELECT id FROM communes  WHERE name='Ambovombe'),
        (SELECT id FROM fokontany WHERE name='Efoetse' AND commune_id=(SELECT id FROM communes WHERE name='Ambovombe'))),

      -- Foulpointe
      ('Foulpointe Bord Mer',  '-17.6824','49.5243',
        (SELECT id FROM provinces WHERE name='Toamasina'),
        (SELECT id FROM regions  WHERE name='Atsinanana'),
        (SELECT id FROM districts WHERE name='Toamasina II'),
        (SELECT id FROM communes  WHERE name='Foulpointe'),
        (SELECT id FROM fokontany WHERE name='Foulpointe Centre' AND commune_id=(SELECT id FROM communes WHERE name='Foulpointe'))),
      ('Mahavelona Village',   '-17.6891','49.5289',
        (SELECT id FROM provinces WHERE name='Toamasina'),
        (SELECT id FROM regions  WHERE name='Atsinanana'),
        (SELECT id FROM districts WHERE name='Toamasina II'),
        (SELECT id FROM communes  WHERE name='Foulpointe'),
        (SELECT id FROM fokontany WHERE name='Mahavelona Bord Mer' AND commune_id=(SELECT id FROM communes WHERE name='Foulpointe'))),

      -- Ranohira (Isalo)
      ('Ranohira Centre Village','-22.5465','45.4012',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Ihorombe'),
        (SELECT id FROM districts WHERE name='Ihosy'),
        (SELECT id FROM communes  WHERE name='Ranohira'),
        (SELECT id FROM fokontany WHERE name='Ranohira Centre' AND commune_id=(SELECT id FROM communes WHERE name='Ranohira'))),
      ('Ilakaka Village',      '-22.6012','45.3354',
        (SELECT id FROM provinces WHERE name='Fianarantsoa'),
        (SELECT id FROM regions  WHERE name='Ihorombe'),
        (SELECT id FROM districts WHERE name='Ihosy'),
        (SELECT id FROM communes  WHERE name='Ranohira'),
        (SELECT id FROM fokontany WHERE name='Ilakaka' AND commune_id=(SELECT id FROM communes WHERE name='Ranohira')))
  `);
  console.log('✅ Villages seeded');
}