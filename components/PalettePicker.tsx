
import React from 'react';
import { motion } from 'framer-motion';
import { PALETTES } from '../constants';
import { Check } from 'lucide-react';

interface PalettePickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const PalettePicker: React.FC<PalettePickerProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
      {PALETTES.map((palette, index) => (
        <motion.button
          key={palette.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(palette.id)}
          className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-1 ${
            selectedId === palette.id ? 'border-white' : 'border-transparent hover:border-zinc-700'
          }`}
          title={palette.name}
        >
          <div className="w-full h-full rounded-xl overflow-hidden flex flex-col">
            <div className="flex-1" style={{ backgroundColor: palette.primary }} />
            <div className="flex-1" style={{ backgroundColor: palette.secondary }} />
          </div>
          
          {selectedId === palette.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <Check className="w-5 h-5 text-white drop-shadow-md" />
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default PalettePicker;
