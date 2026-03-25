document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Using exact Cerfa Fields
    const inputs = {
        // Actif
        actifCirculant: document.getElementById('actif-circulant'),
        creancesClients: document.getElementById('creances-clients'),
        dispo: document.getElementById('disponibilites'),
        totalBilan: document.getElementById('total-bilan'),

        // Passif
        capPropres: document.getElementById('capitaux-propres'),
        empruntsBancaires: document.getElementById('emprunts-bancaires'),
        acomptes: document.getElementById('acomptes-recus'),
        fournisseurs: document.getElementById('dettes-fournisseurs'),
        dettesFiscales: document.getElementById('dettes-fiscales'),

        // EBE Cascade (Compte de Résultat)
        ca: document.getElementById('chiffre-affaires'),
        achats: document.getElementById('achats'),
        chargesExternes: document.getElementById('charges-externes'),
        subventions: document.getElementById('subventions'),
        impotsTaxes: document.getElementById('impots-taxes'),
        chargesPersonnel: document.getElementById('charges-personnel'),

        // Fast-Track (Vérification)
        resultatExploit: document.getElementById('resultat-expl'),
        dotations: document.getElementById('dotations'),
        reprises: document.getElementById('reprises')
    };

    const demoBtn = document.getElementById('demo-btn');
    const form = document.getElementById('financial-form');

    // UI Elements for cascade
    const calcVaEl = document.getElementById('calc-va');
    const calcEbeEl = document.getElementById('calc-ebe');
    const verificationMsgEl = document.getElementById('verification-message');

    // UI Elements for Advice Section
    const adviceSection = document.getElementById('advice-section');
    const listStrengths = document.getElementById('list-strengths');
    const listWeaknesses = document.getElementById('list-weaknesses');
    const blockStrengths = document.getElementById('advice-strengths-block');
    const blockWeaknesses = document.getElementById('advice-weaknesses-block');
    const textConclusion = document.getElementById('text-conclusion');

    // --- PRINT FUNCTIONALITY ---
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Attach real-time calculation to all inputs
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', analyzeFinancials);
        }
    });

    // Demo Data Event (Realistic French Travel Agency Balance Sheet with EBE cascade matching Fast-Track)
    demoBtn.addEventListener('click', () => {
        const targetValues = [
            { el: inputs.actifCirculant, val: 550000 },
            { el: inputs.creancesClients, val: 60000 },
            { el: inputs.dispo, val: 120000 },
            { el: inputs.totalBilan, val: 1000000 },

            { el: inputs.capPropres, val: 300000 },
            { el: inputs.empruntsBancaires, val: 270000 },
            { el: inputs.acomptes, val: 180000 },
            { el: inputs.fournisseurs, val: 150000 },
            { el: inputs.dettesFiscales, val: 100000 },

            // EBE Cascade
            { el: inputs.ca, val: 1500000 },
            { el: inputs.achats, val: 800000 },
            { el: inputs.chargesExternes, val: 300000 },
            { el: inputs.subventions, val: 10000 },
            { el: inputs.impotsTaxes, val: 50000 },
            { el: inputs.chargesPersonnel, val: 300000 },

            // Fast-Track Verification
            // EBE should be: (1500000 - 800000 - 300000) = 400000 VA
            // VA + 10000 - 50000 - 300000 = 60000 EBE
            // Verification: Resultat + Dot - Reprises = 60000 
            // Resultat = 40000, Dotations = 25000, Reprises = 5000
            { el: inputs.resultatExploit, val: 40000 },
            { el: inputs.dotations, val: 25000 },
            { el: inputs.reprises, val: 5000 }
        ];

        targetValues.forEach((item, index) => {
            setTimeout(() => {
                if (item.el) {
                    item.el.value = item.val;
                    item.el.style.transform = 'scale(1.02)';
                    setTimeout(() => item.el.style.transform = 'scale(1)', 150);
                }

                if (index === targetValues.length - 1) {
                    analyzeFinancials();
                }
            }, index * 30);
        });
    });

    // Helpers
    function getVal(inputElem) {
        if (!inputElem || inputElem.value === '') return 0;
        const val = parseFloat(inputElem.value);
        return isNaN(val) ? 0 : val;
    }

    // Check if input is dirty (user actually typed something or demo was used)
    function hasVal(inputElem) {
        return inputElem && inputElem.value !== '';
    }

    function formatCurrency(number) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(number);
    }

    function formatPercent(decimal) {
        return (decimal * 100).toFixed(1) + ' %';
    }

    function updateCard(cardId, valueHtml, badgeText, interpretationText, stateCode) {
        const card = document.getElementById(`card-${cardId}`);
        const valDisplay = document.getElementById(`val-${cardId}`);
        const badge = document.getElementById(`badge-${cardId}`);
        const interpretation = document.getElementById(`inter-${cardId}`);

        if (!card) return;

        card.classList.remove('state-success', 'state-warning', 'state-danger');

        if (stateCode) {
            card.classList.add(`state-${stateCode}`);
        } else {
            badge.innerText = "En attente";
            valDisplay.innerHTML = "-";
        }

        if (valueHtml !== null) valDisplay.innerHTML = valueHtml;
        if (badgeText !== null) badge.innerText = badgeText;
        if (interpretationText !== null) interpretation.innerHTML = interpretationText;
    }

    // Main Analysis Logic
    function analyzeFinancials() {
        const v = {
            actif_circ: getVal(inputs.actifCirculant),
            creances: getVal(inputs.creancesClients),
            dispo: getVal(inputs.dispo),
            total_bilan: getVal(inputs.totalBilan),

            cap_propres: getVal(inputs.capPropres),
            emprunts: getVal(inputs.empruntsBancaires),
            acomptes: getVal(inputs.acomptes),
            fournisseurs: getVal(inputs.fournisseurs),
            fiscal_social: getVal(inputs.dettesFiscales),

            // Cascade
            ca: getVal(inputs.ca),
            achats: getVal(inputs.achats),
            chargesExt: getVal(inputs.chargesExternes),
            subventions: getVal(inputs.subventions),
            impots: getVal(inputs.impotsTaxes),
            perso: getVal(inputs.chargesPersonnel),

            // Fast-Track
            resExploit: getVal(inputs.resultatExploit),
            dot: getVal(inputs.dotations),
            rep: getVal(inputs.reprises)
        };

        // --- STEP 1 & 2: CASCADE CALCULATION (VA & EBE) ---
        const valeurAjoutee = v.ca - v.achats - v.chargesExt;
        const cascadeEBE = valeurAjoutee + v.subventions - v.impots - v.perso;

        calcVaEl.innerText = formatCurrency(valeurAjoutee);
        calcEbeEl.innerText = formatCurrency(cascadeEBE);

        // --- STEP 3: FAST-TRACK VERIFICATION ---
        const fastTrackEBE = v.resExploit + v.dot - v.rep;
        const ebeVariance = Math.abs(cascadeEBE - fastTrackEBE);

        const isVerifFilled = hasVal(inputs.resultatExploit) || hasVal(inputs.dotations) || hasVal(inputs.reprises);
        const isCascadeFilled = hasVal(inputs.ca) || hasVal(inputs.achats) || hasVal(inputs.chargesExternes);

        let isValidEBE = true;

        if (!isCascadeFilled) {
            verificationMsgEl.className = 'alert msg-info';
            verificationMsgEl.innerHTML = '<i class="fa-solid fa-circle-info"></i> Remplissez le compte de résultat pour calculer l\'EBE.';
        } else if (isCascadeFilled && !isVerifFilled) {
            verificationMsgEl.className = 'alert msg-warning';
            verificationMsgEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <strong>Avertissement :</strong> Remplissez la ligne Résultat d\'Exploitation pour vérifier l\'exactitude.';
        } else if (ebeVariance <= 1) { // Allowing 1 euro tolerance
            verificationMsgEl.className = 'alert msg-success';
            verificationMsgEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> <strong>Parfait !</strong> L\'EBE calculé (' + formatCurrency(cascadeEBE) + ') correspond exactement à la méthode Fast-Track.';
        } else {
            isValidEBE = false;
            verificationMsgEl.className = 'alert msg-error';
            verificationMsgEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> <strong>Erreur de Cohérence :</strong> L\'EBE en cascade (<strong>' + formatCurrency(cascadeEBE) + '</strong>) ne correspond pas à l\'EBE Fast-Track (<strong>' + formatCurrency(fastTrackEBE) + '</strong>). Vérifiez les saisies !';
        }

        // derived indicators
        const dettes_ct = v.acomptes + v.fournisseurs + v.fiscal_social;
        const dette_nette = v.emprunts - v.dispo;
        const ebe = cascadeEBE;
        const isDataEntered = dettes_ct > 0 || v.total_bilan > 0 || v.ca > 0;

        if (!isDataEntered) {
            resetGlobalAssessment();
            resetAdvice();
            return;
        }

        let totalScore = 0;
        let maxScore = 0;

        // Data structure to hold insights for the written advice section
        const insights = {
            strengths: [],
            weaknesses: []
        };

        // 1. Liquidité (Test de Survie)
        let liquiditeValue = 0;
        if (dettes_ct > 0) {
            maxScore += 2;
            const liquidite = v.actif_circ / dettes_ct;
            liquiditeValue = liquidite;
            let status, stateCode, interp;

            if (liquidite > 1.1) {
                status = 'Confortable'; stateCode = 'success'; totalScore += 2;
                interp = 'Actif circulant suffisant pour couvrir les Dettes CT.';
                insights.strengths.push("<strong>Excellente liquidité (" + liquidite.toFixed(2) + ") :</strong> L'agence n'a aucun problème immédiat pour régler ses dettes à moins d'un an, ce qui limite le risque de cessation de paiement.");
            } else if (liquidite >= 0.9) {
                status = 'Vigilance'; stateCode = 'warning'; totalScore += 1;
                interp = 'Attention, la trésorerie est tendue pour couvrir les exigibilités à court terme.';
                insights.weaknesses.push("<strong>Trésorerie tendue (" + liquidite.toFixed(2) + ") :</strong> La liquidité globale est tout juste suffisante pour couvrir les dettes à court terme. Il y a un risque en cas d'imprévu.");
            } else {
                status = 'Danger'; stateCode = 'danger'; totalScore += 0;
                interp = 'Danger ! Les dettes à court terme sont supérieures à l\'actif circulant.';
                insights.weaknesses.push("<strong>Alerte de liquidité (" + liquidite.toFixed(2) + ") :</strong> L'actif circulant ne permet pas de couvrir le passif de court terme. Le risque de défaut de paiement est élevé.");
            }
            updateCard('liquidite', liquidite.toFixed(2), status, interp, stateCode);
        } else {
            updateCard('liquidite', null, null, null, null);
        }

        // 2. Solvabilité (Indépendance)
        let solvabiliteValue = 0;
        if (v.total_bilan > 0) {
            maxScore += 2;
            const solvabilite = v.cap_propres / v.total_bilan;
            solvabiliteValue = solvabilite;
            let status, stateCode, interp;

            if (solvabilite > 0.25) {
                status = 'Solide'; stateCode = 'success'; totalScore += 2;
                interp = 'Excellente indépendance par rapport aux créanciers externes.';
                insights.strengths.push("<strong>Forte indépendance financière (" + formatPercent(solvabilite) + ") :</strong> Vos capitaux propres sont très solides. L'entreprise vous appartient majoritairement et non à vos créanciers.");
            } else if (solvabilite >= 0.15) {
                status = 'Moyen'; stateCode = 'warning'; totalScore += 1;
                interp = 'Structure acceptable, mais attention à la rentabilité pour la consolider.';
                insights.weaknesses.push("<strong>Indépendance financière moyenne (" + formatPercent(solvabilite) + ") :</strong> Vos fonds propres sont acceptables, mais mériteraient d'être renforcés en mettant en réserve une partie de vos bénéfices futurs.");
            } else {
                status = 'Fragile'; stateCode = 'danger'; totalScore += 0;
                interp = 'Fonds propres trop faibles au regard du total bilan.';
                insights.weaknesses.push("<strong>Carence en Capitaux Propres (" + formatPercent(solvabilite) + ") :</strong> L'entreprise est sous-capitalisée. Cela fragilise votre image et votre structure financière. Prévoyez une augmentation de capital ou l'intégration de prêts participatifs.");
            }
            updateCard('independance', formatPercent(solvabilite), status, interp, stateCode);
        }

        // 3. BFR (Bombe à retardement)
        let bfrValue = 0;
        if (v.fournisseurs > 0 || v.creances > 0 || v.acomptes > 0 || v.fiscal_social > 0) {
            const bfr = v.creances - (v.fournisseurs + v.acomptes + v.fiscal_social);
            bfrValue = bfr;
            document.getElementById('val-bfr').innerHTML = formatCurrency(bfr);

            // Insight for BFR: Normally agencies have negative BFR (they collect cash before paying). So a huge negative BFR is typical but forms a "bomb".
            if (bfr < -(v.ca * 0.2)) {
                insights.weaknesses.push("<strong>Vigilance BFR (Le modèle Tourisme) :</strong> Votre modèle génère une trésorerie artificielle importante en dettes fournisseurs/acomptes (" + formatCurrency(Math.abs(bfr)) + " de ressource). Cet argent ne vous appartient pas. Toute baisse de CA pompera immédiatement votre trésorerie réelle.");
            } else {
                insights.strengths.push("<strong>Modèle de BFR maîtrisé :</strong> Le volume de trésorerie lié aux acomptes et dettes fournisseurs reste dans une proportion saine par rapport à votre volume d'affaires.");
            }
        }

        // 4. Efficacité Réelle (Marge d'EBE)
        let margeEbeValue = 0;
        if (v.ca > 0 && isCascadeFilled) {
            maxScore += 2;
            const margeEbe = ebe / v.ca;
            margeEbeValue = margeEbe;
            let status, stateCode, interp;

            if (margeEbe >= 0.03) {
                status = 'Très bon'; stateCode = 'success'; totalScore += 2;
                interp = 'L\'EBE dégagé est excellent pour le secteur de l\'agence (> 3%).';
                insights.strengths.push("<strong>Forte rentabilité d'exploitation (" + formatPercent(margeEbe) + ") :</strong> L'entreprise parvient à dégager plus de 3% d'Excédent Brut d'Exploitation, ce qui est une très belle performance dans l'industrie du tourisme.");
            } else if (margeEbe >= 0.01) {
                status = 'Moyen'; stateCode = 'warning'; totalScore += 1;
                interp = 'Performance moyenne, rentabilité positive mais la marge de manœuvre est fine.';
                insights.weaknesses.push("<strong>Marge d'EBE fragile (" + formatPercent(margeEbe) + ") :</strong> L'EBE est positif mais très mince (entre 1% et 3%). La rentabilité repose sur un fil. Une optimisation de vos charges externes ou une augmentation des frais de services est conseillée.");
            } else {
                status = 'Critique'; stateCode = 'danger'; totalScore += 0;
                interp = 'L\'EBE est inférieur à 1% voire négatif. L\'exploitation n\'est pas saine.';
                insights.weaknesses.push("<strong>Alerte sur la rentabilité :</strong> Le modèle actuel ne dégage pas d'Excédent Brut d'Exploitation suffisant par rapport au Chiffre d'Affaires. Les charges (personnel ou structure) absorbent toute votre valeur ajoutée.");
            }
            let finalStatus = !isValidEBE && isVerifFilled ? status + ' <i title="Erreur vérification" class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i>' : status;
            updateCard('efficacite', formatPercent(margeEbe), finalStatus, interp, stateCode);
        } else {
            updateCard('efficacite', null, null, null, null);
        }

        // 5. Capacité de Remboursement
        let capaciteRemboursementValue = null;
        if (ebe !== 0 && isCascadeFilled && (dette_nette > 0 || dette_nette <= 0)) {
            maxScore += 2;
            const capacite = dette_nette / (ebe > 0 ? ebe : 1);
            capaciteRemboursementValue = capacite;
            let status, stateCode, interp;

            if (ebe <= 0 && dette_nette > 0) {
                status = 'Danger'; stateCode = 'danger'; totalScore += 0;
                interp = 'EBE négatif ou nul, impossible de rembourser la dette existante.';
                insights.weaknesses.push("<strong>Insolvabilité technique :</strong> Avec une dettenette positive et un EBE nul ou négatif, vous ne produisez pas la richesse nécessaire pour rembourser vos dettes bancaires actuelles.");
                updateCard('remboursement', 'Impossible', status, interp, stateCode);
            } else {
                if (capacite <= 3) {
                    status = 'Très bien'; stateCode = 'success'; totalScore += 2;
                    interp = 'Dette maîtrisée, remboursable en moins de 3 ans d\'EBE.';
                    if (dette_nette > 0) {
                        insights.strengths.push("<strong>Excellent profil d'emprunteur :</strong> Votre dette nette représente moins de 3 ans d'EBE. Vous avez une forte capacité de désendettement et pouvez lever de la dette facilement auprès des banques si besoin.");
                    } else {
                        insights.strengths.push("<strong>Aucune dette nette :</strong> Aux yeux des banques, votre situation est idéale. Vos disponibilités absorbent totalement vos dettes financières.");
                    }
                } else if (capacite <= 5) {
                    status = 'Acceptable'; stateCode = 'warning'; totalScore += 1;
                    interp = 'Capacité sous surveillance, remboursable entre 3 et 5 ans d\'EBE.';
                    insights.weaknesses.push("<strong>Endettement modéré (" + capacite.toFixed(1) + " ans) :</strong> Le niveau d'emprunt est gérable mais vous laisse peu de flexibilité pour de nouveaux projets d'investissement. L'EBE doit être maintenu coûte que coûte.");
                } else {
                    status = 'Inquiétant'; stateCode = 'danger'; totalScore += 0;
                    interp = 'Surendettement (> 5 années d\'EBE). Risque de tension sur la trésorerie.';
                    insights.weaknesses.push("<strong>Surendettement (" + capacite.toFixed(1) + " ans) :</strong> Vos dettes bancaires sont beaucoup trop importantes compte tenu de l'EBE actuel. Renégociez vos échéances ou privilégiez l'apport en fonds propres pour désendetter.");
                }

                let valHtml = dette_nette <= 0 ? 'Sans Dette' : capacite.toFixed(1) + ' <span style="font-size:0.5em;opacity:0.6;font-weight:400;">ans</span>';
                let finalStatus = !isValidEBE && isVerifFilled ? status + ' <i title="Erreur vérification" class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i>' : status;
                updateCard('remboursement', valHtml, finalStatus, interp, stateCode);
            }
        } else {
            updateCard('remboursement', null, null, null, null);
        }

        // Update Global Assessment
        if (maxScore > 0) {
            updateGlobalAssessment(totalScore, maxScore, isValidEBE, isVerifFilled);
            generateAdviceSection(insights, totalScore, maxScore, isValidEBE);
        }
    }

    function resetGlobalAssessment() {
        const assessmentDiv = document.getElementById('global-assessment');
        const title = document.getElementById('assessment-title');
        const desc = document.getElementById('assessment-desc');
        const scoreVal = document.getElementById('score-value');
        const ringProgress = document.getElementById('score-ring-progress');

        assessmentDiv.style.setProperty('--state-color', 'transparent');
        title.innerText = "En attente des données (Cerfa)";
        title.style.color = "var(--text-primary)";
        desc.innerText = "Recopiez vos chiffres comptables à gauche pour obtenir un diagnostic automatique de la solidité financière.";
        scoreVal.innerText = "0";

        ringProgress.style.strokeDashoffset = 283;
        ringProgress.style.stroke = "#52525b";
    }

    function resetAdvice() {
        adviceSection.style.display = 'none';
        listStrengths.innerHTML = '';
        listWeaknesses.innerHTML = '';
        textConclusion.innerHTML = '';
    }

    function generateAdviceSection(insights, score, max, isValidEBE) {
        // Show section
        adviceSection.style.display = 'block';

        // Filter valid insights
        const strengths = insights.strengths;
        const weaknesses = insights.weaknesses;

        // Render Strengths
        if (strengths.length > 0) {
            blockStrengths.style.display = 'block';
            let html = '';
            strengths.forEach(s => html += `<li>${s}</li>`);
            listStrengths.innerHTML = html;
        } else {
            blockStrengths.style.display = 'none';
        }

        // Render Weaknesses
        if (weaknesses.length > 0) {
            blockWeaknesses.style.display = 'block';
            let html = '';
            weaknesses.forEach(w => html += `<li>${w}</li>`);
            listWeaknesses.innerHTML = html;
        } else {
            blockWeaknesses.style.display = 'none';
        }

        // Generate Conclusion Strategy
        let percent = score / max;
        if (!isValidEBE) percent = Math.min(percent, 0.49); // Cap to bad if invalid EBE

        let strategyHtml = "";

        if (!isValidEBE) {
            strategyHtml = "<strong>Priorité Absolue : Correction des Données.</strong> Avant toute analyse stratégique, vous devez corriger les incohérences de votre compte de résultat. L'EBE calculé et l'EBE de vérification (Fast-Track) ne correspondent pas. Des erreurs de saisie empêchent un pilotage fiable (vérifiez vos charges, ou l'oubli de dotations aux amortissements).";
        } else if (percent >= 0.8) {
            strategyHtml = "<strong>Position Stratégique Maximale : Croissance & Sécurisation.</strong> Votre agence de voyage affiche une santé de fer selon ce bilan. Le modèle économique est rentable et structuré. Vos défis futurs se porteront sur <em>la fidélisation des collaborateurs clés</em> (souvent source d'inflation du compte 64), et l'utilisation de votre levier d'emprunt pour de potentiels <em>rachats de portefeuilles clients ou d'autres agences.</em>";
        } else if (percent >= 0.5) {
            strategyHtml = "<strong>Position Défensive : Optimisation Initiale.</strong> La structure est viable mais n'autorise pas de forts mouvements stratégiques non anticipés. L'objectif prioritaire de l'année doit être de faire remonter de quelques points la marge d'EBE par le biais d'un ajustement des <em>frais de services/honoraires</em> ou une réduction agressive des <em>charges externes</em>. Gardez un oeil permanent sur la variation de votre compte client et fournisseurs (Acomptes).";
        } else {
            strategyHtml = "<strong>Plan de Sauvegarde : Restructuration.</strong> Les chiffres indiquent des fondamentaux en danger. Vous devez impérativement entrer dans un plan drastique de gestion de trésorerie. Les priorités sont : 1. Négocier des rallongements d'échéances pour votre dette. 2. Stopper les dépenses de charges externes non vitales. 3. Surveiller de très près vos échéances à court terme car votre solvabilité risque d'être scrutée par vos partenaires financiers et fournisseurs.";
        }

        textConclusion.innerHTML = strategyHtml;
    }

    function updateGlobalAssessment(score, max, isValidEBE, isVerifFilled) {
        let percent = score / max;
        // Penalize the global score heavily if there is a detected data consistency error and verification is filled
        if (!isValidEBE && isVerifFilled) {
            percent = Math.min(percent, 0.49); // Cap to danger state
        }

        const normalizedScore = percent * 10;
        const finalScore = normalizedScore.toFixed(1).replace('.0', '');

        const assessmentDiv = document.getElementById('global-assessment');
        const title = document.getElementById('assessment-title');
        const desc = document.getElementById('assessment-desc');
        const scoreVal = document.getElementById('score-value');
        const ringProgress = document.getElementById('score-ring-progress');

        scoreVal.innerText = finalScore;

        const offset = 283 - (283 * percent);
        ringProgress.style.strokeDashoffset = offset;

        if (!isValidEBE && isVerifFilled) {
            assessmentDiv.style.setProperty('--state-color', 'var(--danger)');
            ringProgress.style.stroke = "var(--danger)";
            title.innerText = "Saisie Incohérente";
            desc.innerHTML = "<strong>Attention !</strong> Le diagnostic ne peut pas être fiable car votre méthode de calcul de l'EBE (en cascade) ne retombe pas sur le résultat d'exploitation. Veuillez corriger vos chiffres comptables pour un audit précis.";
        } else if (percent >= 0.8) {
            assessmentDiv.style.setProperty('--state-color', 'var(--success)');
            ringProgress.style.stroke = "var(--success)";
            title.innerText = "Excellente Situation Financière";
            desc.innerHTML = "<strong>Bravo !</strong> L'agence présente une structure extrêmement solide. Liquidité, indépendance et rentabilité d'exploitation (EBE) excellentes selon votre bilan.";
        } else if (percent >= 0.5) {
            assessmentDiv.style.setProperty('--state-color', 'var(--warning)');
            ringProgress.style.stroke = "var(--warning)";
            title.innerText = "Situation Saine mais Perfectible";
            desc.innerHTML = "<strong>Attention sur certains points.</strong> L'agence devrait survivre à court terme, mais certains ratios doivent être suivis de près pour ne pas dégrader le modèle de l'exploitation.";
        } else {
            assessmentDiv.style.setProperty('--state-color', 'var(--danger)');
            ringProgress.style.stroke = "var(--danger)";
            title.innerText = "Situation Financière Critique";
            desc.innerHTML = "<strong>Danger Immédiat !</strong> BFR lourd, manque de trésorerie ou rentabilité beaucoup trop faible au vu des dettes. Des solutions radicales de redressement doivent être envisagées.";
        }
    }
});
