

# Sirene Web — Plateforme d'envoi d'alertes SMS vers sirènes

## Vue d'ensemble
Application React frontend qui consomme une API NestJS existante pour gérer l'envoi d'alertes SMS vers des sirènes physiques. Thème clair et professionnel.

---

## 1. Authentification (Login via API backend)
- **Page de connexion** : email + mot de passe → appel API NestJS `/auth/login` → stockage JWT
- **Gestion des rôles** : superadmin (voit tout) vs clients (voient uniquement leurs alertes via `customers_id`)
- **Routes protégées** avec redirection si non connecté

## 2. Layout & Navigation
- **Sidebar** avec menu :
  - 🏠 Dashboard
  - 🔔 Alertes (Catastrophe naturelle / Communication communautaire)
  - 📡 Sirènes (gestion)
  - 🔊 Audios (gestion des fichiers audio par sous-catégorie)
  - 📋 Notifications (historique envois)
  - 👥 Utilisateurs (superadmin)
  - 🏢 Clients (superadmin)
- **Header** avec nom utilisateur, rôle, et déconnexion

## 3. Dashboard
- Statistiques clés : nombre de sirènes actives, alertes envoyées aujourd'hui/ce mois, taux de succès d'envoi
- Graphiques : alertes envoyées par jour (recharts), répartition par type d'alerte
- Dernières notifications envoyées (aperçu rapide)
- Carte ou liste des sirènes par statut (actives/inactives)

## 4. Envoi d'alertes manuelles — Flux en étapes (Stepper)

### 4a. Catastrophe naturelle
Formulaire en étapes guidées :
1. **Choisir l'alerte** → liste depuis `alerte` (ex: Catastrophe naturelle)
2. **Choisir le type** → liste depuis `alerte_type` (ex: Cyclone, Inondation)
3. **Choisir la catégorie** → depuis `categorie_alerte` (ex: Temps estimé d'impact)
4. **Choisir la sous-catégorie** → depuis `sous_categorie_alerte` (ex: 1 jour, 2 jours avant danger) — l'audio associé est automatiquement sélectionné
5. **Choisir les zones** → sélection par Province / Région / District → récupère les sirènes présentes dans ces zones
6. **Planifier l'envoi** → maintenant, dans 1h, 2h, ou heure personnalisée
7. **Résumé & validation** → récapitulatif complet avant envoi → appel API backend

### 4b. Communication communautaire
Même flux simplifié :
1. Choisir l'alerte (Communication communautaire)
2. Choisir le type (ex: Sensibilisation)
3. Choisir la catégorie (Type de communication)
4. Choisir le message / sous-catégorie
5. Choisir les zones (Province / Région / District)
6. Résumé & envoi

## 5. Gestion des Sirènes
- Liste des sirènes avec filtres (village, province, région, statut actif/inactif)
- Détail d'une sirène : IMEI, coordonnées GPS, numéros téléphone (brain/relai), village associé
- CRUD via API (ajout, modification, activation/désactivation)

## 6. Gestion des Audios
- Liste des audios par sous-catégorie d'alerte (`alerte_audio`)
- Upload/écoute d'audio
- Association audio ↔ sous-catégorie d'alerte

## 7. Historique des Notifications
- Table paginée affichant `notification_sirene_alerte` : type, opérateur, statut, message, heure d'envoi, sirène cible, statut opérateur
- Filtres par date, statut, type d'alerte, client
- Détail d'une notification

## 8. Gestion Utilisateurs & Clients (superadmin)
- CRUD utilisateurs avec attribution de rôle et client
- CRUD clients (customers)
- Le superadmin n'a pas de `customers_id` (nullable)

## 9. Gestion géographique
- Pages pour visualiser/gérer les Provinces → Régions → Districts → Villages
- Hiérarchie navigable pour localiser les sirènes

## 10. Architecture technique
- **API service centralisé** : URL de base configurable (`http://localhost:3000/api`), intercepteur JWT pour toutes les requêtes
- **React Query** pour le cache et les appels API
- **React Router** pour la navigation
- **Types TypeScript** correspondant aux tables de la BDD
- **Thème clair** avec composants shadcn/ui
- Données mockées en fallback si l'API n'est pas disponible (pour le développement)

