# Patch QU-24 : mise en ligne (environ 15 min, une seule fois)

L'app se compose de deux morceaux :
- **la base de données** : un Google Sheet (gratuit), qui vérifie aussi le mot de passe `micm` ;
- **l'app** : une page web gratuite sur GitHub Pages, que chacun installe sur son iPhone.

L'équipe n'a besoin d'aucun compte : le lien suffit pour consulter, et le mot de passe pour modifier.

## Étape 1 : la base de données (Google Sheet)
1. Va sur https://sheets.new et crée une feuille nommée « Patch QU-24 ».
2. Menu **Extensions > Apps Script**. Efface le contenu et colle tout le fichier `google-apps-script/Code.gs`. Enregistre.
3. En haut, choisis la fonction **installer** puis clique **Exécuter**. Autorise l'accès (« Paramètres avancés > Accéder au projet » si Google affiche un avertissement : c'est ton propre script).
   Les onglets Entrées, Mix, Scènes et Catégories sont créés, avec la piste modèle sur l'entrée 24.
4. **Déployer > Nouveau déploiement**, puis la roue dentée > **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
   - Clique **Déployer** et copie l'**URL de l'application Web** (elle finit par `/exec`).

## Étape 2 : relier l'app
Ouvre `config.js` et colle l'URL entre les guillemets :
```js
window.QU24_API = "https://script.google.com/macros/s/XXXX/exec";
```

## Étape 3 : mettre l'app en ligne (GitHub Pages)
1. Sur https://github.com/new, crée un dépôt **public** nommé `patch-qu24`.
2. Clique **uploading an existing file** et glisse-y tous les fichiers du dossier (sauf le dossier `google-apps-script`, inutile en ligne). Clique **Commit changes**.
3. **Settings > Pages** : Source = *Deploy from a branch*, Branch = `main` / `(root)`, **Save**.
4. Après 1 à 2 minutes, l'app est à l'adresse `https://<ton-pseudo>.github.io/patch-qu24/`.

## Étape 4 : installer sur iPhone
Ouvre le lien dans **Safari**, touche **Partager**, puis **Sur l'écran d'accueil**. L'app s'ouvre en plein écran comme une vraie app et affiche le dernier patch connu même sans réseau.
Envoie simplement le lien à l'équipe (WhatsApp, SMS…).

## Au quotidien
- **Consulter** : ouvrir l'app. Elle se met à jour toute seule toutes les 30 secondes.
- **Modifier** : « Mode édition », prénom et mot de passe (mémorisés sur l'appareil si la case est cochée).
- **Changer le mot de passe** : Apps Script > Paramètres du projet (roue dentée) > Propriétés du script > `EDIT_PASSWORD`. Les membres devront le ressaisir.
- **Tout voir en tableau** : le Google Sheet lui-même, ou le bouton « Exporter (Excel) ».

## Si tu modifies Code.gs plus tard
Déployer > **Gérer les déploiements** > crayon > Version : **Nouvelle version** > Déployer. L'URL reste la même.
