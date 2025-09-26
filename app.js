// Application de Gestion Électorale - Référendum Toulouse 2025
let appState = {
    mode: 'recherche',
    electeurs: {
        'BV-1': [],
        'BV-2': [],
        'BV-3': []
    },
    selectedElecteur: null,
    isDataLoaded: false
};

// Configuration
const CONFIG = {
    bureaux: {
        'BV-1': { nom: 'Bureau BV-1', couleur: '#1E40AF', total: 456 },
        'BV-2': { nom: 'Bureau BV-2', couleur: '#DC2626', total: 455 },
        'BV-3': { nom: 'Bureau BV-3', couleur: '#059669', total: 455 }
    },
    statuts: {
        'carte_non_distribuee': 'Carte non distribuée',
        'carte_distribuee': 'Carte distribuée', 
        'present_vote': 'Présent au vote',
        'a_vote': 'A voté',
        'absent': 'Absent'
    },
    totalElecteurs: 1366
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation du système électoral Toulouse...');
    initializeApp();
    setupEventListeners();
    loadElectoralData();
});

function initializeApp() {
    // Effacer les données locales au démarrage pour une session propre
    localStorage.removeItem('electoralData');
    console.log('🧹 Données locales précédentes effacées.');

    switchMode('recherche');
    updateAllStats();
    console.log('✅ Application initialisée avec succès');
}

function loadElectoralData() {
    try {
        // Vérifie si la variable `electoralData` (de database.js) existe.
        if (typeof electoralData === 'undefined' || !electoralData) {
            throw new Error("La variable 'electoralData' n'est pas définie. Assurez-vous que le fichier 'database.js' est inclus avant 'app.js' dans index.html.");
        }

        console.log('📊 Données chargées directement depuis la variable electoralData.');

        // Initialise le statut de chaque électeur.
        Object.keys(electoralData).forEach(bureau => {
            if (electoralData[bureau]) {
                electoralData[bureau].forEach(electeur => {
                    electeur.statut = 'carte_non_distribuee';
                });
            }
        });

        appState.electeurs = electoralData;
        appState.isDataLoaded = true;

        // Mettre à jour l'interface utilisateur maintenant que les données sont prêtes.
        updateAllStats();
        updateCartesNonDistribuees();

        console.log('📋 Données électorales prêtes:', {
            'BV-1': appState.electeurs['BV-1'] ? appState.electeurs['BV-1'].length : 0,
            'BV-2': appState.electeurs['BV-2'] ? appState.electeurs['BV-2'].length : 0,
            'BV-3': appState.electeurs['BV-3'] ? appState.electeurs['BV-3'].length : 0
        });

    } catch (error) {
        console.error('❌ Erreur critique lors du chargement des données :', error);
        alert("Erreur critique: Impossible de charger les listes électorales. " + error.message);
    }
}


function setupEventListeners() {
    console.log('🔧 Configuration des event listeners...');
    
    // Sélecteur de mode - Fixed event handling
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        // Supprimer tout event listener existant
        modeSelector.removeEventListener('change', handleModeChange);
        // Ajouter le nouveau listener
        modeSelector.addEventListener('change', handleModeChange);
        console.log('✅ Mode selector configuré');
    } else {
        console.error('❌ Mode selector non trouvé');
    }

    // Mode Recherche
    setupRechercheListeners();
    
    // Mode Distribution
    setupDistributionListeners();
    
    // Mode Entrée
    setupEntreeListeners();
    
    // Mode Émargement
    setupEmargementListeners();
    
    // Mode Tableau de bord
    setupTableauListeners();

    console.log('🔧 Event listeners configurés');
}

function handleModeChange(e) {
    const newMode = e.target.value;
    console.log('🔄 Mode change requested:', newMode, 'from event:', e);
    
    // Prévenir les changements multiples
    e.preventDefault();
    e.stopPropagation();
    
    switchMode(newMode);
}

function switchMode(mode) {
    console.log('🔄 Changement de mode vers:', mode);
    
    // Valider le mode
    const validModes = ['recherche', 'distribution', 'entree', 'emargement', 'tableau-bord'];
    if (!validModes.includes(mode)) {
        console.error('❌ Mode invalide:', mode);
        return;
    }
    
    // Cacher toutes les sections
    document.querySelectorAll('.mode-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section correspondante
    const targetSection = document.getElementById(`mode-${mode}`);
    if (targetSection) {
        targetSection.classList.add('active');
        appState.mode = mode;
        
        // Mettre à jour le sélecteur seulement si nécessaire
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector && modeSelector.value !== mode) {
            // Temporairement désactiver l'event listener pour éviter les boucles
            modeSelector.removeEventListener('change', handleModeChange);
            modeSelector.value = mode;
            // Réactiver l'event listener
            setTimeout(() => {
                modeSelector.addEventListener('change', handleModeChange);
            }, 100);
        }
        
        // Actions spécifiques par mode
        handleModeSwitch(mode);
        console.log('✅ Mode changé vers:', mode);
    } else {
        console.error('❌ Section non trouvée pour le mode:', mode);
    }
}

function handleModeSwitch(mode) {
    switch(mode) {
        case 'recherche':
            // Réinitialiser les résultats
            hideElement('resultatsRecherche');
            break;
        case 'distribution':
            updateDistributionStats();
            hideElement('electeurDistribution');
            break;
        case 'entree':
            updateEntreeStats();
            hideElement('electeurEntree');
            break;
        case 'emargement':
            updateEmargementStats();
            hideElement('electeurEmargement');
            break;
        case 'tableau-bord':
            updateTableauStats();
            updateCartesNonDistribuees();
            break;
    }
}

// MODE RECHERCHE
function setupRechercheListeners() {
    const btnRechercher = document.getElementById('btnRechercher');
    const btnEffacerRecherche = document.getElementById('btnEffacerRecherche');
    
    if (btnRechercher) {
        btnRechercher.addEventListener('click', effectuerRecherche);
    }
    
    if (btnEffacerRecherche) {
        btnEffacerRecherche.addEventListener('click', effacerRecherche);
    }
    
    // Recherche en temps réel sur nom, prénom et date de naissance
    const searchNom = document.getElementById('searchNom');
    const searchPrenom = document.getElementById('searchPrenom');
    const searchDateNaissance = document.getElementById('searchDateNaissance');

    if (searchNom) {
        searchNom.addEventListener('input', debounce(effectuerRecherche, 300));
        searchNom.addEventListener('keyup', debounce(effectuerRecherche, 300));
    }

    if (searchPrenom) {
        searchPrenom.addEventListener('input', debounce(effectuerRecherche, 300));
        searchPrenom.addEventListener('keyup', debounce(effectuerRecherche, 300));
    }

    if (searchDateNaissance) {
        searchDateNaissance.addEventListener('change', effectuerRecherche);
        searchDateNaissance.addEventListener('input', effectuerRecherche);
    }

    console.log('✅ Listeners de recherche configurés pour nom, prénom et date de naissance');
}

function effectuerRecherche() {
    const nom = document.getElementById('searchNom')?.value?.trim()?.toUpperCase() || '';
    const prenom = document.getElementById('searchPrenom')?.value?.trim() || '';
    const dateNaissance = document.getElementById('searchDateNaissance')?.value || '';
    
    if (!nom && !prenom) {
        hideElement('resultatsRecherche');
        return;
    }
    
    console.log('🔍 Recherche:', { nom, prenom, dateNaissance });
    
    const resultats = rechercherElecteurs(nom, prenom, dateNaissance);
    afficherResultatsRecherche(resultats);
}

function rechercherElecteurs(nom, prenom, dateNaissance) {
    const resultats = [];
    
    Object.entries(appState.electeurs).forEach(([bureau, liste]) => {
        liste.forEach(electeur => {
            let score = 0;
            
            // Recherche par nom (stricte)
            if (nom && electeur.nom.includes(nom)) {
                score += 3;
            }
            
            // Recherche par prénom (flexible)
            if (prenom && electeur.prenom.toLowerCase().includes(prenom.toLowerCase())) {
                score += 2;
            }
            
            // Recherche par date de naissance (exacte)
            if (dateNaissance && electeur.date_naissance === convertDateFormat(dateNaissance)) {
                score += 4;
            }
            
            if (score > 0) {
                resultats.push({
                    ...electeur,
                    bureau,
                    score
                });
            }
        });
    });
    
    // Trier par score décroissant
    return resultats.sort((a, b) => b.score - a.score);
}

function afficherResultatsRecherche(resultats) {
    const container = document.getElementById('resultatsContainer');
    const section = document.getElementById('resultatsRecherche');
    
    if (!container || !section) return;
    
    if (resultats.length === 0) {
        container.innerHTML = '<div class="empty-state"><h4>Aucun résultat</h4><p>Aucun électeur trouvé avec ces critères</p></div>';
    } else {
        container.innerHTML = resultats.map(electeur => `
            <div class="resultat-electeur">
                <h4>${electeur.nom} ${electeur.prenom}</h4>
                <div class="electeur-details">
                    <div class="detail-row">
                        <span class="detail-label">Bureau:</span>
                        <span class="detail-value">${electeur.bureau}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Numéro:</span>
                        <span class="detail-value">${electeur.numero}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date de naissance:</span>
                        <span class="detail-value">${formatDate(electeur.date_naissance)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Profession:</span>
                        <span class="detail-value">${electeur.profession}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Statut:</span>
                        <span class="detail-value">${getStatusBadge(electeur.statut)}</span>
                    </div>
                </div>
                <div class="file-indication">
                    <h5>🎯 Orientation:</h5>
                    <p>File ${electeur.bureau} (${CONFIG.bureaux[electeur.bureau].nom})</p>
                </div>
            </div>
        `).join('');
    }
    
    showElement('resultatsRecherche');
}

function effacerRecherche() {
    document.getElementById('searchNom').value = '';
    document.getElementById('searchPrenom').value = '';
    document.getElementById('searchDateNaissance').value = '';
    hideElement('resultatsRecherche');
}

// MODE DISTRIBUTION
function setupDistributionListeners() {
    const distributionSearch = document.getElementById('distributionSearch');
    const distributionBureau = document.getElementById('distributionBureau');
    const btnMarquerDistribuee = document.getElementById('btnMarquerDistribuee');
    
    if (distributionSearch) {
        distributionSearch.addEventListener('input', debounce(rechercherPourDistribution, 300));
    }
    
    if (distributionBureau) {
        distributionBureau.addEventListener('change', rechercherPourDistribution);
    }
    
    if (btnMarquerDistribuee) {
        btnMarquerDistribuee.addEventListener('click', marquerCarteDistribuee);
    }
}

function rechercherPourDistribution() {
    const terme = document.getElementById('distributionSearch')?.value?.trim() || '';
    const bureau = document.getElementById('distributionBureau')?.value || '';
    
    if (terme.length < 2) {
        document.getElementById('distributionResultats').innerHTML = '';
        return;
    }
    
    const resultats = rechercherElecteursDistribution(terme, bureau);
    afficherResultatsDistribution(resultats);
}

function rechercherElecteursDistribution(terme, bureauFiltre) {
    const resultats = [];
    const termeUpper = terme.toUpperCase();
    
    Object.entries(appState.electeurs).forEach(([bureau, liste]) => {
        if (bureauFiltre && bureau !== bureauFiltre) return;
        
        liste.forEach(electeur => {
            if (electeur.nom.includes(termeUpper) ||
                electeur.prenom.toLowerCase().includes(terme.toLowerCase()) ||
                electeur.numero.toString().includes(terme)) {
                resultats.push({
                    ...electeur,
                    bureau
                });
            }
        });
    });
    
    return resultats.slice(0, 10); // Limiter à 10 résultats
}

function afficherResultatsDistribution(resultats) {
    const container = document.getElementById('distributionResultats');
    if (!container) return;
    
    if (resultats.length === 0) {
        container.innerHTML = '<p class="text-secondary">Aucun résultat</p>';
        return;
    }
    
    container.innerHTML = resultats.map(electeur => `
        <div class="search-result-item" onclick="selectionnerElecteurDistribution('${electeur.bureau}', ${electeur.numero})">
            <strong>${electeur.nom} ${electeur.prenom}</strong><br>
            <small>${electeur.bureau} - N°${electeur.numero} - ${getStatusBadge(electeur.statut)}</small>
        </div>
    `).join('');
}

window.selectionnerElecteurDistribution = function(bureau, numero) {
    const electeur = trouverElecteur(bureau, numero);
    if (electeur) {
        appState.selectedElecteur = { ...electeur, bureau };
        afficherElecteurPourDistribution(appState.selectedElecteur);
    }
};

function afficherElecteurPourDistribution(electeur) {
    const container = document.getElementById('infoElecteurDistribution');
    if (!container) return;
    
    container.innerHTML = `
        <div class="electeur-details">
            <div class="detail-row">
                <span class="detail-label">Nom complet:</span>
                <span class="detail-value">${electeur.nom} ${electeur.prenom}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Bureau:</span>
                <span class="detail-value">${electeur.bureau}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Numéro:</span>
                <span class="detail-value">${electeur.numero}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date de naissance:</span>
                <span class="detail-value">${formatDate(electeur.date_naissance)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Profession:</span>
                <span class="detail-value">${electeur.profession}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Statut actuel:</span>
                <span class="detail-value">${getStatusBadge(electeur.statut)}</span>
            </div>
        </div>
    `;
    
    showElement('electeurDistribution');
}

function marquerCarteDistribuee() {
    if (!appState.selectedElecteur) return;
    
    const { bureau, numero, nom, prenom } = appState.selectedElecteur;
    
    if (appState.selectedElecteur.statut !== 'carte_non_distribuee') {
        alert('Cette carte a déjà été distribuée ou l\'électeur a un autre statut');
        return;
    }
    
    // Mettre à jour le statut
    changerStatutElecteur(bureau, numero, 'carte_distribuee');
    
    // Mettre à jour l'affichage
    updateDistributionStats();
    hideElement('electeurDistribution');
    
    // Réinitialiser la recherche
    document.getElementById('distributionSearch').value = '';
    document.getElementById('distributionResultats').innerHTML = '';
    
    appState.selectedElecteur = null;
    
    alert(`Carte distribuée à ${nom} ${prenom}`);
}

// MODE ENTREE
function setupEntreeListeners() {
    const entreeSearch = document.getElementById('entreeSearch');
    const entreeBureau = document.getElementById('entreeBureau');
    const btnMarquerPresent = document.getElementById('btnMarquerPresent');
    
    if (entreeSearch) {
        entreeSearch.addEventListener('input', debounce(rechercherPourEntree, 300));
    }
    
    if (entreeBureau) {
        entreeBureau.addEventListener('change', rechercherPourEntree);
    }
    
    if (btnMarquerPresent) {
        btnMarquerPresent.addEventListener('click', marquerElecteurPresent);
    }
}

function rechercherPourEntree() {
    const terme = document.getElementById('entreeSearch')?.value?.trim() || '';
    const bureau = document.getElementById('entreeBureau')?.value || '';
    
    if (terme.length < 2) {
        document.getElementById('entreeResultats').innerHTML = '';
        return;
    }
    
    const resultats = rechercherElecteursDistribution(terme, bureau);
    afficherResultatsEntree(resultats);
}

function afficherResultatsEntree(resultats) {
    const container = document.getElementById('entreeResultats');
    if (!container) return;
    
    if (resultats.length === 0) {
        container.innerHTML = '<p class="text-secondary">Aucun résultat</p>';
        return;
    }
    
    container.innerHTML = resultats.map(electeur => `
        <div class="search-result-item" onclick="selectionnerElecteurEntree('${electeur.bureau}', ${electeur.numero})">
            <strong>${electeur.nom} ${electeur.prenom}</strong><br>
            <small>${electeur.bureau} - N°${electeur.numero} - ${getStatusBadge(electeur.statut)}</small>
        </div>
    `).join('');
}

window.selectionnerElecteurEntree = function(bureau, numero) {
    const electeur = trouverElecteur(bureau, numero);
    if (electeur) {
        appState.selectedElecteur = { ...electeur, bureau };
        afficherElecteurPourEntree(appState.selectedElecteur);
    }
};

function afficherElecteurPourEntree(electeur) {
    if (electeur.statut !== 'carte_distribuee') {
        alert('Cet électeur n\'a pas encore récupéré sa carte d\'électeur');
        return;
    }
    
    const container = document.getElementById('infoElecteurEntree');
    const orientationContainer = document.getElementById('orientationFile');
    
    if (container) {
        container.innerHTML = `
            <div class="electeur-details">
                <div class="detail-row">
                    <span class="detail-label">Nom complet:</span>
                    <span class="detail-value">${electeur.nom} ${electeur.prenom}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Bureau:</span>
                    <span class="detail-value">${electeur.bureau}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Numéro:</span>
                    <span class="detail-value">${electeur.numero}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Statut:</span>
                    <span class="detail-value">${getStatusBadge(electeur.statut)}</span>
                </div>
            </div>
        `;
    }
    
    if (orientationContainer) {
        orientationContainer.innerHTML = `
            <h4>🎯 Orientation vers la file:</h4>
            <p>File ${electeur.bureau} (${CONFIG.bureaux[electeur.bureau].nom})</p>
        `;
    }
    
    showElement('electeurEntree');
}

function marquerElecteurPresent() {
    if (!appState.selectedElecteur) return;
    
    const { bureau, numero, nom, prenom } = appState.selectedElecteur;
    
    if (appState.selectedElecteur.statut !== 'carte_distribuee') {
        alert('Cet électeur n\'a pas le bon statut pour être marqué présent');
        return;
    }
    
    // Mettre à jour le statut
    changerStatutElecteur(bureau, numero, 'present_vote');
    
    // Mettre à jour l'affichage
    updateEntreeStats();
    hideElement('electeurEntree');
    
    // Réinitialiser la recherche
    document.getElementById('entreeSearch').value = '';
    document.getElementById('entreeResultats').innerHTML = '';
    
    appState.selectedElecteur = null;
    
    alert(`${nom} ${prenom} marqué présent au vote`);
}

// MODE EMARGEMENT
function setupEmargementListeners() {
    const btnChercherEmargement = document.getElementById('btnChercherEmargement');
    const btnMarquerVote = document.getElementById('btnMarquerVote');
    
    if (btnChercherEmargement) {
        btnChercherEmargement.addEventListener('click', rechercherPourEmargement);
    }
    
    if (btnMarquerVote) {
        btnMarquerVote.addEventListener('click', marquerElecteurVote);
    }
}

function rechercherPourEmargement() {
    const numero = parseInt(document.getElementById('emargementNumero')?.value) || 0;
    const bureau = document.getElementById('emargementBureau')?.value || '';
    
    if (!numero || !bureau) {
        alert('Veuillez saisir le numéro et sélectionner le bureau');
        return;
    }
    
    const electeur = trouverElecteur(bureau, numero);
    const container = document.getElementById('emargementResultat');
    
    if (!electeur) {
        container.innerHTML = '<div class="error">Électeur non trouvé</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="search-result-item" onclick="selectionnerElecteurEmargement('${bureau}', ${numero})">
            <strong>${electeur.nom} ${electeur.prenom}</strong><br>
            <small>${bureau} - N°${numero} - ${getStatusBadge(electeur.statut)}</small>
        </div>
    `;
}

window.selectionnerElecteurEmargement = function(bureau, numero) {
    const electeur = trouverElecteur(bureau, numero);
    if (electeur) {
        appState.selectedElecteur = { ...electeur, bureau };
        afficherElecteurPourEmargement(appState.selectedElecteur);
    }
};

function afficherElecteurPourEmargement(electeur) {
    if (electeur.statut !== 'present_vote') {
        alert('Cet électeur n\'est pas encore présent au bureau de vote');
        return;
    }
    
    const container = document.getElementById('infoElecteurEmargement');
    const signatureContainer = document.getElementById('signatureInfo');
    
    if (container) {
        container.innerHTML = `
            <div class="electeur-details">
                <div class="detail-row">
                    <span class="detail-label">Nom complet:</span>
                    <span class="detail-value">${electeur.nom} ${electeur.prenom}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Bureau:</span>
                    <span class="detail-value">${electeur.bureau}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Numéro:</span>
                    <span class="detail-value">${electeur.numero}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Statut:</span>
                    <span class="detail-value">${getStatusBadge(electeur.statut)}</span>
                </div>
            </div>
        `;
    }
    
    if (signatureContainer) {
        signatureContainer.innerHTML = `
            <h4>✍️ Signature requise:</h4>
            <p>L'électeur doit signer à la case N°${electeur.numero} de la liste ${electeur.bureau}</p>
        `;
    }
    
    showElement('electeurEmargement');
}

function marquerElecteurVote() {
    if (!appState.selectedElecteur) return;
    
    const { bureau, numero, nom, prenom } = appState.selectedElecteur;
    
    if (appState.selectedElecteur.statut !== 'present_vote') {
        alert('Cet électeur n\'a pas le bon statut pour être marqué comme ayant voté');
        return;
    }
    
    // Mettre à jour le statut avec horodatage
    const electeur = trouverElecteur(bureau, numero);
    if (electeur) {
        electeur.dateVote = new Date().toISOString();
    }
    
    changerStatutElecteur(bureau, numero, 'a_vote');
    
    // Mettre à jour l'affichage
    updateEmargementStats();
    updateAllStats();
    hideElement('electeurEmargement');
    
    // Réinitialiser le formulaire
    document.getElementById('emargementNumero').value = '';
    document.getElementById('emargementBureau').value = '';
    document.getElementById('emargementResultat').innerHTML = '';
    
    appState.selectedElecteur = null;
    
    alert(`Vote confirmé pour ${nom} ${prenom}`);
}

// MODE TABLEAU DE BORD
function setupTableauListeners() {
    const btnExportComplet = document.getElementById('btnExportComplet');
    const btnExportEmargement = document.getElementById('btnExportEmargement');
    const btnExportParBureau = document.getElementById('btnExportParBureau');
    const btnExportStats = document.getElementById('btnExportStats');
    
    if (btnExportComplet) {
        btnExportComplet.addEventListener('click', () => exportData('complet'));
    }
    
    if (btnExportEmargement) {
        btnExportEmargement.addEventListener('click', () => exportData('emargement'));
    }
    
    if (btnExportParBureau) {
        btnExportParBureau.addEventListener('click', () => exportData('bureau'));
    }
    
    if (btnExportStats) {
        btnExportStats.addEventListener('click', () => exportData('stats'));
    }
}

// UTILITAIRES
function trouverElecteur(bureau, numero) {
    const liste = appState.electeurs[bureau];
    if (!liste) return null;
    
    return liste.find(e => e.numero === numero);
}

function changerStatutElecteur(bureau, numero, nouveauStatut) {
    const electeur = trouverElecteur(bureau, numero);
    if (electeur) {
        electeur.statut = nouveauStatut;
        electeur.lastUpdate = new Date().toISOString();
        saveData();
        console.log(`📝 Statut changé: ${bureau}-${numero} -> ${nouveauStatut}`);
    }
}

function getStatusBadge(statut) {
    const classes = {
        'carte_non_distribuee': 'status-non-distribuee',
        'carte_distribuee': 'status-distribuee',
        'present_vote': 'status-present',
        'a_vote': 'status-vote',
        'absent': 'status-non-distribuee'
    };
    
    return `<span class="status-badge ${classes[statut] || ''}">${CONFIG.statuts[statut] || statut}</span>`;
}

function countElecteursByStatus(statut, bureau = null) {
    let count = 0;
    
    const bureaux = bureau ? [bureau] : Object.keys(appState.electeurs);
    
    bureaux.forEach(b => {
        if (appState.electeurs[b]) {
            count += appState.electeurs[b].filter(e => e.statut === statut).length;
        }
    });
    
    return count;
}

function updateDistributionStats() {
    Object.keys(CONFIG.bureaux).forEach(bureau => {
        const count = countElecteursByStatus('carte_distribuee', bureau);
        const element = document.getElementById(`distrib-${bureau.toLowerCase()}`);
        if (element) element.textContent = count;
    });
}

function updateEntreeStats() {
    Object.keys(CONFIG.bureaux).forEach(bureau => {
        const count = countElecteursByStatus('present_vote', bureau);
        const element = document.getElementById(`present-${bureau.toLowerCase()}`);
        if (element) element.textContent = count;
    });
}

function updateEmargementStats() {
    Object.keys(CONFIG.bureaux).forEach(bureau => {
        const count = countElecteursByStatus('a_vote', bureau);
        const element = document.getElementById(`vote-${bureau.toLowerCase()}`);
        if (element) element.textContent = count;
    });
}

function updateTableauStats() {
    // Stats globales
    const totalDistribuees = countElecteursByStatus('carte_distribuee');
    const totalPresents = countElecteursByStatus('present_vote');
    const totalVotes = countElecteursByStatus('a_vote');
    const tauxParticipation = Math.round((totalVotes / CONFIG.totalElecteurs) * 100);
    
    updateElementText('totalDistribuees', totalDistribuees);
    updateElementText('totalPresents', totalPresents);
    updateElementText('totalVotes', totalVotes);
    updateElementText('tauxParticipation', `${tauxParticipation}%`);
    
    // Stats par bureau
    Object.keys(CONFIG.bureaux).forEach(bureau => {
        const distribuees = countElecteursByStatus('carte_distribuee', bureau);
        const presents = countElecteursByStatus('present_vote', bureau);
        const votes = countElecteursByStatus('a_vote', bureau);
        const taux = Math.round((votes / CONFIG.bureaux[bureau].total) * 100);
        
        const bureauKey = bureau.toLowerCase();
        updateElementText(`${bureauKey}-distribuees`, distribuees);
        updateElementText(`${bureauKey}-presents`, presents);
        updateElementText(`${bureauKey}-votes`, votes);
        updateElementText(`${bureauKey}-taux`, `${taux}%`);
    });
}

function updateAllStats() {
    if (!appState.isDataLoaded) return;
    
    updateDistributionStats();
    updateEntreeStats();
    updateEmargementStats();
    updateTableauStats();
}

function updateCartesNonDistribuees() {
    const container = document.getElementById('cartesNonDistribuees');
    if (!container) return;
    
    const nonDistribuees = [];
    
    Object.entries(appState.electeurs).forEach(([bureau, liste]) => {
        liste.forEach(electeur => {
            if (electeur.statut === 'carte_non_distribuee') {
                nonDistribuees.push({ ...electeur, bureau });
            }
        });
    });
    
    if (nonDistribuees.length === 0) {
        container.innerHTML = '<div class="success">✅ Toutes les cartes ont été distribuées !</div>';
        return;
    }
    
    // Limiter l'affichage aux 50 premières
    const displayed = nonDistribuees.slice(0, 50);
    
    container.innerHTML = `
        <p><strong>${nonDistribuees.length} cartes non distribuées</strong> (affichage des 50 premières)</p>
        ${displayed.map(electeur => `
            <div class="non-distribuee-item">
                <div class="non-distribuee-info">
                    <strong>${electeur.nom} ${electeur.prenom}</strong><br>
                    <small>N°${electeur.numero} - ${formatDate(electeur.date_naissance)}</small>
                </div>
                <div class="non-distribuee-bureau">${electeur.bureau}</div>
            </div>
        `).join('')}
    `;
}

// EXPORTS
function exportData(type) {
    let data = [];
    let filename = '';
    
    switch(type) {
        case 'complet':
            data = exportDataComplet();
            filename = 'referendum-toulouse-export-complet';
            break;
        case 'emargement':
            data = exportDataEmargement();
            filename = 'referendum-toulouse-emargement';
            break;
        case 'bureau':
            data = exportDataParBureau();
            filename = 'referendum-toulouse-par-bureau';
            break;
        case 'stats':
            data = exportDataStats();
            filename = 'referendum-toulouse-statistiques';
            break;
    }
    
    if (data.length === 0) {
        alert('Aucune donnée à exporter');
        return;
    }
    
    const csv = convertToCSV(data);
    downloadCSV(csv, `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportDataComplet() {
    const data = [];
    
    Object.entries(appState.electeurs).forEach(([bureau, liste]) => {
        liste.forEach(electeur => {
            data.push({
                'Bureau': bureau,
                'Numéro': electeur.numero,
                'Nom': electeur.nom,
                'Prénom': electeur.prenom,
                'Date de naissance': electeur.date_naissance,
                'Sexe': electeur.sexe,
                'Profession': electeur.profession,
                'Statut': CONFIG.statuts[electeur.statut],
                'Date vote': electeur.dateVote ? new Date(electeur.dateVote).toLocaleString('fr-FR') : '',
                'Dernière modification': electeur.lastUpdate ? new Date(electeur.lastUpdate).toLocaleString('fr-FR') : ''
            });
        });
    });
    
    return data.sort((a, b) => {
        if (a.Bureau !== b.Bureau) return a.Bureau.localeCompare(b.Bureau);
        return a.Numéro - b.Numéro;
    });
}

function exportDataEmargement() {
    const data = [];
    
    Object.entries(appState.electeurs).forEach(([bureau, liste]) => {
        liste.filter(e => e.statut === 'a_vote').forEach(electeur => {
            data.push({
                'Bureau': bureau,
                'Numéro': electeur.numero,
                'Nom': electeur.nom,
                'Prénom': electeur.prenom,
                'Heure vote': electeur.dateVote ? new Date(electeur.dateVote).toLocaleString('fr-FR') : ''
            });
        });
    });
    
    return data.sort((a, b) => {
        if (a.Bureau !== b.Bureau) return a.Bureau.localeCompare(b.Bureau);
        return a.Numéro - b.Numéro;
    });
}

function exportDataParBureau() {
    const data = [];
    
    Object.keys(CONFIG.bureaux).forEach(bureau => {
        const config = CONFIG.bureaux[bureau];
        const distribuees = countElecteursByStatus('carte_distribuee', bureau);
        const presents = countElecteursByStatus('present_vote', bureau);
        const votes = countElecteursByStatus('a_vote', bureau);
        
        data.push({
            'Bureau': bureau,
            'Nom': config.nom,
            'Total électeurs': config.total,
            'Cartes distribuées': distribuees,
            'Présents': presents,
            'Votes': votes,
            'Taux participation': `${Math.round((votes / config.total) * 100)}%`
        });
    });
    
    return data;
}

function exportDataStats() {
    const totalDistribuees = countElecteursByStatus('carte_distribuee');
    const totalPresents = countElecteursByStatus('present_vote');
    const totalVotes = countElecteursByStatus('a_vote');
    
    return [{
        'Date export': new Date().toLocaleString('fr-FR'),
        'Total électeurs': CONFIG.totalElecteurs,
        'Cartes distribuées': totalDistribuees,
        'Électeurs présents': totalPresents,
        'Votes confirmés': totalVotes,
        'Taux participation': `${Math.round((totalVotes / CONFIG.totalElecteurs) * 100)}%`,
        'BV-1 votes': countElecteursByStatus('a_vote', 'BV-1'),
        'BV-2 votes': countElecteursByStatus('a_vote', 'BV-2'),
        'BV-3 votes': countElecteursByStatus('a_vote', 'BV-3')
    }];
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(',')
        )
    ].join('\n');
    
    return csvContent;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// UTILITAIRES GÉNÉRIQUES
function showElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.remove('hidden');
}

function hideElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.add('hidden');
}

function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    // Convertir du format DD/MM/YYYY vers un format lisible
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    
    return dateString;
}

function convertDateFormat(dateInput) {
    // Convertir du format YYYY-MM-DD vers DD/MM/YYYY
    const date = new Date(dateInput);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// SAUVEGARDE ET CHARGEMENT
function saveData() {
    try {
        // Ne sauvegarde que les statuts pour alléger le stockage
        const statutsToSave = {};
        Object.entries(appState.electeurs).forEach(([bureau, liste]) => {
            statutsToSave[bureau] = liste.map(e => ({
                numero: e.numero,
                statut: e.statut,
                dateVote: e.dateVote,
                lastUpdate: e.lastUpdate
            }));
        });

        const data = {
            statuts: statutsToSave,
            lastSave: new Date().toISOString()
        };
        localStorage.setItem('referendum-toulouse-2025', JSON.stringify(data));
        console.log('💾 Données de session sauvegardées');
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
    }
}

function loadSavedData() {
    // Cette fonction n'est plus nécessaire car l'état est réinitialisé à chaque chargement.
    // Le localStorage est effacé dans initializeApp().
    // Je laisse la fonction vide pour éviter des erreurs si elle est appelée ailleurs.
}

// Auto-sauvegarde toutes les 30 secondes
setInterval(() => {
    if (appState.isDataLoaded) {
        saveData();
    }
}, 30000);

// Sauvegarde à la fermeture
window.addEventListener('beforeunload', () => {
    saveData();
});

console.log('🎯 Système de gestion électoral Toulouse prêt !');

