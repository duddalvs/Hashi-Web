import { useEffect, useState } from 'react';
import {
  BarChart3,
  Clock3,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';

export const navigation = [
  {
    key: 'inicio',
    title: 'Análise geral',
    icon: LayoutDashboard,
    group: 'PRINCIPAL',
    desc: 'Acompanhe os indicadores, as equipes e os custos da sua operação.',
  },
  {
    key: 'equipes',
    title: 'Registro de equipes',
    icon: Users,
    group: 'OPERAÇÃO',
    desc: 'Organize e acompanhe as equipes da sua operação.',
  },
  {
    key: 'manutencoes',
    title: 'Manutenções',
    icon: Wrench,
    group: 'OPERAÇÃO',
    desc: 'Controle os serviços realizados e os custos da frota.',
  },
  {
    key: 'historico',
    title: 'Histórico de envios',
    icon: Clock3,
    group: 'OPERAÇÃO',
    desc: 'Todos os envios disponíveis para o seu perfil, em um só lugar.',
  },
  {
    key: 'veiculos',
    title: 'Veículos',
    icon: Truck,
    group: 'CADASTROS',
    desc: 'Consulte os veículos e equipamentos da sua frota.',
  },
  {
    key: 'funcionarios',
    title: 'Funcionários',
    icon: Users,
    group: 'CADASTROS',
    desc: 'Pessoas disponíveis para compor as equipes e registrar serviços.',
  },
  {
    key: 'contratos',
    title: 'Contratos',
    icon: MapPin,
    group: 'CADASTROS',
    desc: 'Os contratos que fazem parte da operação.',
  },
  {
    key: 'usuarios',
    title: 'Usuários',
    icon: ShieldCheck,
    group: 'CADASTROS',
    desc: 'Gerencie as contas de acesso ao web e ao Hashi App.',
  },
  {
    key: 'relatorios',
    title: 'Relatórios e custos',
    icon: BarChart3,
    group: 'GESTÃO',
    desc: 'Analise os custos de manutenção por período, contrato e veículo.',
  },
];
export type Service = (typeof navigation)[number];
const serviceKeys = navigation.map((service) => service.key);
const storageKey = (id: string) => `hashi-menu:${id}`;
type Preferences = { owner: string; favorites: string[]; recent: string[] };

function readPreferences(owner: string): Preferences {
  const defaults = { owner, favorites: serviceKeys, recent: [] };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey(owner)) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    const validKeys = (value: unknown, fallback: string[]) =>
      Array.isArray(value)
        ? [
            ...new Set(
              value.filter(
                (key): key is string => typeof key === 'string' && serviceKeys.includes(key),
              ),
            ),
          ]
        : fallback;
    return {
      owner,
      favorites: validKeys('favorites' in saved ? saved.favorites : null, serviceKeys),
      recent: validKeys('recent' in saved ? saved.recent : null, []).slice(0, 6),
    };
  } catch {
    return defaults;
  }
}

export function useMenuPreferences(owner: string, page: string, admin: boolean) {
  const [preferences, setPreferences] = useState<Preferences>(() => readPreferences(owner));
  useEffect(() => {
    setPreferences(readPreferences(owner));
  }, [owner]);
  useEffect(() => {
    if (
      !owner ||
      preferences.owner !== owner ||
      !serviceKeys.includes(page) ||
      (page === 'usuarios' && !admin)
    )
      return;
    setPreferences((current) => ({
      ...current,
      recent: [page, ...current.recent.filter((key) => key !== page)].slice(0, 6),
    }));
  }, [owner, page, admin, preferences.owner]);
  useEffect(() => {
    if (!owner || preferences.owner !== owner) return;
    try {
      localStorage.setItem(
        storageKey(owner),
        JSON.stringify({ favorites: preferences.favorites, recent: preferences.recent }),
      );
    } catch {}
  }, [owner, preferences]);
  return {
    favorites: preferences.owner === owner ? preferences.favorites : serviceKeys,
    recent: preferences.owner === owner ? preferences.recent : [],
    toggleFavorite: (key: string) =>
      setPreferences((current) => ({
        ...current,
        favorites: current.favorites.includes(key)
          ? current.favorites.filter((item) => item !== key)
          : [...current.favorites, key],
      })),
  };
}
