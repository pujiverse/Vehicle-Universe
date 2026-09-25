// Pujiverse Transport — window.Pujiverse (React 18). Types are documentation.
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
export type Domain = 'Land' | 'Rail' | 'Water' | 'Air' | 'Space';
export type Tone = 'positive' | 'info' | 'neutral' | 'caution' | 'negative';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'md' | 'sm'; children: ReactNode; }
export function Button(p: ButtonProps): JSX.Element;
export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> { selected?: boolean; domain?: Domain; count?: number; children: ReactNode; }
export function FilterChip(p: FilterChipProps): JSX.Element;
/** status: a dataset market_status string, e.g. "In production". */
export function StatusPill(p: { status: string; tone?: Tone; className?: string }): JSX.Element;
export function ConfidenceBadge(p: { level: 'High' | 'Medium' | 'Low'; className?: string }): JSX.Element;
export function MonogramBadge(p: { name: string; monogram: string; color: string; imageUrl?: string | null; size?: number; showName?: boolean; className?: string }): JSX.Element;
export interface CardProps { domain?: Domain; selected?: boolean; media?: ReactNode; title?: ReactNode; badge?: ReactNode; meta?: ReactNode; children?: ReactNode; onClick?: () => void; href?: string; className?: string; }
export function Card(p: CardProps): JSX.Element;
/** regions: availability_by_region; values "Widely available" | "Limited / select countries" | "Not available". */
export function AvailabilityGrid(p: { regions: Record<string, string>; order?: string[]; note?: string; className?: string }): JSX.Element;
export function Timeline(p: { items: Array<{ year: string; event: string } | string>; highlight?: string | number; className?: string }): JSX.Element;
export function Breadcrumb(p: { items: Array<{ label: string; href?: string; onClick?: () => void; domain?: Domain }>; className?: string }): JSX.Element;
export function SearchField(p: InputHTMLAttributes<HTMLInputElement> & { label?: string }): JSX.Element;
/** Readable letter colour (#ffffff or #0f0c21) for a monogram disc. */
export function inkOn(color: string): string;
export function statusTone(status: string): Tone;
