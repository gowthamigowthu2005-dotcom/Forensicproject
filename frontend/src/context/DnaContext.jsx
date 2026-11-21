import { createContext, useContext, useState } from 'react';

const DnaContext = createContext();

export function getMarkersAndProbsForTraits(traits) {
  const eye = (traits.eyeColor || 'brown').toLowerCase();
  const hair = (traits.observedHairColor || traits.hairColor || 'black').toLowerCase();
  const skin = (traits.skinTone || 'medium').toLowerCase();

  // Eye color SNP markers according to Walsh et al. HIrisPlex-S protocol
  // rs12913832 (HERC2/OCA2) is the primary determinant of blue vs brown eye color:
  // GG = Blue / Light eyes
  // AG = Hazel / Green / Intermediate
  // AA = Brown / Dark eyes
  let rs12913832 = 'AA';
  let rs1800407 = 'CC';
  let eyeProbs = { brown: 0.85, hazel: 0.09, green: 0.04, blue: 0.02 };

  if (eye === 'blue') {
    rs12913832 = 'GG';
    rs1800407 = 'CC';
    eyeProbs = { blue: 0.88, hazel: 0.06, green: 0.04, brown: 0.02 };
  } else if (eye === 'green') {
    rs12913832 = 'AG';
    rs1800407 = 'GG';
    eyeProbs = { green: 0.58, hazel: 0.22, blue: 0.12, brown: 0.08 };
  } else if (eye === 'hazel') {
    rs12913832 = 'AG';
    rs1800407 = 'CG';
    eyeProbs = { hazel: 0.65, brown: 0.20, green: 0.10, blue: 0.05 };
  } else if (eye === 'black') {
    rs12913832 = 'AA';
    rs1800407 = 'CC';
    eyeProbs = { brown: 0.94, hazel: 0.04, green: 0.01, blue: 0.01 };
  }

  // Hair color probabilities
  let hairProbs = { black: 0.70, brown: 0.20, blonde: 0.08, red: 0.02 };
  if (hair === 'brown') {
    hairProbs = { brown: 0.68, black: 0.20, blonde: 0.08, red: 0.04 };
  } else if (hair === 'blonde') {
    hairProbs = { blonde: 0.75, brown: 0.15, red: 0.06, black: 0.04 };
  } else if (hair === 'red') {
    hairProbs = { red: 0.78, blonde: 0.12, brown: 0.08, black: 0.02 };
  }

  // Skin tone probabilities
  let skinProbs = { medium: 0.60, fair: 0.22, olive: 0.12, dark: 0.06 };
  if (skin === 'fair') {
    skinProbs = { fair: 0.72, medium: 0.20, olive: 0.05, dark: 0.03 };
  } else if (skin === 'olive') {
    skinProbs = { olive: 0.65, medium: 0.25, fair: 0.05, dark: 0.05 };
  } else if (skin === 'dark' || skin === 'brown') {
    skinProbs = { dark: 0.68, brown: 0.22, medium: 0.08, fair: 0.02 };
  }

  const snpMarkers = [
    { marker: 'rs12913832', allele: rs12913832 },
    { marker: 'rs1800407', allele: rs1800407 },
    { marker: 'rs16891982', allele: hair === 'blonde' || hair === 'red' ? 'CC' : 'GG' },
    { marker: 'rs12896399', allele: eye === 'blue' ? 'GG' : 'TT' },
  ];

  return {
    snpMarkers,
    probabilities: {
      eyeColor: eyeProbs,
      hairColor: hairProbs,
      skinTone: skinProbs,
    },
  };
}

export function DnaProvider({ children }) {
  const initialTraits = {
    sex: 'male',
    hairColor: 'black',
    eyeColor: 'brown',
    cheekbone: 'high',
    skinTone: 'medium',
    observedHairColor: 'black',
  };

  const initialDna = getMarkersAndProbsForTraits(initialTraits);

  const [dnaState, setDnaState] = useState({
    snpMarkers: initialDna.snpMarkers,
    traits: initialTraits,
    probabilities: initialDna.probabilities,
    rawMarkerString: initialDna.snpMarkers.map((m) => `${m.marker}: ${m.allele}`).join(' | '),
  });

  const updateTraits = (newTraits) => {
    setDnaState((prev) => {
      const mergedTraits = { ...prev.traits, ...newTraits };
      // Dynamically sync SNP markers & probabilities with updated traits
      const synced = getMarkersAndProbsForTraits(mergedTraits);
      return {
        ...prev,
        traits: mergedTraits,
        snpMarkers: synced.snpMarkers,
        probabilities: synced.probabilities,
        rawMarkerString: synced.snpMarkers.map((m) => `${m.marker}: ${m.allele}`).join(' | '),
      };
    });
  };

  const setFullProfile = (profile) => {
    setDnaState((prev) => {
      const mergedTraits = profile.traits ? { ...prev.traits, ...profile.traits } : prev.traits;
      const synced = getMarkersAndProbsForTraits(mergedTraits);

      const finalMarkers = (profile.snpMarkers && profile.snpMarkers.length > 0)
        ? profile.snpMarkers
        : synced.snpMarkers;

      const finalProbs = (profile.probabilities && Object.keys(profile.probabilities).length > 0)
        ? profile.probabilities
        : synced.probabilities;

      return {
        ...prev,
        traits: mergedTraits,
        snpMarkers: finalMarkers,
        probabilities: finalProbs,
        rawMarkerString: finalMarkers.map((m) => `${m.marker}: ${m.allele}`).join(' | '),
      };
    });
  };

  return (
    <DnaContext.Provider value={{ dnaState, updateTraits, setFullProfile }}>
      {children}
    </DnaContext.Provider>
  );
}

export function useDna() {
  const context = useContext(DnaContext);
  if (!context) {
    throw new Error('useDna must be used within a DnaProvider');
  }
  return context;
}
