import * as d3 from 'd3';
import { VoronoiTreemap } from 'd3-voronoi-treemap';

declare module 'd3' {
    export const voronoiTreemap: () => VoronoiTreemap<any>; // Adjust the return type accordingly
}