/* eslint-disable camelcase */

export interface BaseModel {
  id: string
  payload: any
  date_synced: Date
  date_created: Date
  date_updated: Date
  is_deleted: boolean
}

export interface ItemModel extends BaseModel {
  source_id: string
  parent_id: string
  subject_agg?: string[]
  author_agg?: string[]
  accesses_agg?: string[]
  language_agg?: string[]
  location_agg?: string[]
  startDate?: any
}

export interface FileModel extends BaseModel {
  source_id: string
  order: number
  item_id: string
  items?: any
  title?: string
  description?: string
  props?: any
}

export interface BookModel extends BaseModel {
  source_id: string
  order: number
  item_id: string
}

export interface RelationshipType {
  /** hashed value based on type and key value */
  id?: string
  /** Related type */
  type?: string
  /** Unique identifier of the related type */
  key?: string
  /** Denormalised value of related document */
  title?: string
  value?: any
  enumId?: string
  url?: string
  fileSize?: string
}

export interface HoldingType {
  id: string
  callNumber: string
  copyNumber: string
  location: string
  publicNotes: []
  textualHoldings: []
}
export interface DateType {
  type?: string
  startDate?: string
  endDate?: string
  dateText?: string
}

export interface VariantType {
  width: number
  height: number
  url: string
}

export interface VariantsType {
  [k: string]: VariantType
}

export interface TitleFacetType {
  id: string
  title: string
  total: number
}

export interface DateFacetType {
  id: string
  startDate: string
  endDate: string
  total: number
}

export interface CollectionType<T> {
  total?: number
  data?: T[]
}

export interface FacetsType {
  [k: string]: CollectionType<TitleFacetType | DateFacetType>
}

export interface CollectionFacetsType<T> extends CollectionType<T> {
  facets?: FacetsType
}

export interface FileSummary {
  id: string
  title: string
  description: string
  fileType: string
  item: string
  image?: ImageSummary
  groupResultsTotal?: number
}

export interface TextType {
  url?: string
  fileSize?: number
  blocks?: BlocksType
}

export interface BlocksType {
  [k: string]: any
}

export interface BlockType {
  id?: string
  value?: string
}

export interface ItemSummary {
  id: string
  title: string
  authorCreators?: CollectionType<RelationshipType>
  callNumbers?: CollectionType<{ value: string }>
  dates?: CollectionType<DateType>
  filesTotal?: number
  parentItem?: string
  itemType?: string
  files?: CollectionType<FileSummary>
  hierarchyPosition?: string
  hierarchyLevel?: string
  publishers: CollectionType<{ value: string }>
  holdings?: CollectionType<{ id: string; callNumber: string }>
}

export interface ItemTextSummary {
  id: string
  files?: CollectionType<FileSummary>
}

export interface TextSearchType {
  id: string
  matches?: TextSearchWordType
  matchesTotal?: number
}

export interface TextSearchWordType {
  [k: string]: BoundingBoxType
}

export interface ImageSummary {
  fileName: string
  fileSize: number
  width: number
  height: number
  iiifImageUrl: string
  variants: VariantsType
  focalPoint: FocalPointType
  boundingBox: BoundingBoxType
}

export interface DocumentSummary {
  enumId?: string
  type: string
  value: string
  url: string
  fileSize: number
}

export interface ImageFileHierarchy {
  variants: VariantsType
}

export interface DocumentType {
  [k: string]: DocumentSummary
}

export interface FileHierarchy {
  id: string
  title: string
  index: number
  image?: ImageFileHierarchy
}

export interface FocalPointType {
  x: number
  y: number
}

export interface BoundingBoxType {
  x: number
  y: number
  width: number
  height: number
}

export interface File {
  id: string
  title: string
  description: string
  fileType: string
  identifiers: CollectionType<RelationshipType>
  otherTitles: CollectionType<{ value: string }>
  dates?: CollectionType<DateType>
  subjects: CollectionType<RelationshipType>
  item: ItemSummary
  groupItemId?: string
  partOfItemId?: string
  text?: TextType
  image?: ImageSummary
  documents?: CollectionType<DocumentType>
}

export interface ItemHierarchy {
  id: string
  index: number
  title: string
  formatGroups: CollectionType<{ enumId: string; title: string }>
  filePrimary?: FileHierarchy
}

export interface ItemHierarchyId {
  id: string
  index: number
}
export interface BoolType {
  data: boolean
}
export interface NumberType {
  total: number
}
export interface ParentItemType {
  id: string
}

export interface SystemDateType {
  created: string
  ingested: string
  updated: string
}

export interface Item {
  id: string
  title: string
  description: string
  objectNumber: string
  sourceCatalogue: string
  levelOfDescription: string
  arrangement: CollectionType<{ value: string }>
  authors: CollectionType<RelationshipType>
  dates: CollectionType<DateType>
  systemDates: CollectionType<SystemDateType>
  subjects: CollectionType<RelationshipType>
  otherDescriptions: CollectionType<RelationshipType>
  classifications: CollectionType<RelationshipType>
  languages: CollectionType<RelationshipType>
  relatedItems: CollectionType<RelationshipType>
  callNumbers: CollectionType<{ value: string }>
  otherTitles: CollectionType<{ value: string }>
  identifiers: CollectionType<RelationshipType>
  editions: CollectionType<{ value: string }>
  versions: CollectionType<{ value: string }>
  accesses: CollectionType<{ title: string; url: string }>
  accessConditions: CollectionType<{ value: string }>
  physicalAccessConditions: CollectionType<{ value: string }>
  physicalDescriptions: CollectionType<{ value: string }>
  issueCopies: CollectionType<{ value: string }>
  publishers: CollectionType<{ value: string }>
  publisherSeries: CollectionType<{ value: string }>
  series: CollectionType<{ value: string }>
  findingAids: CollectionType<{ value: string }>
  futureAdditions: CollectionType<{ value: string }>
  biographicalHistory: CollectionType<{ value: string }>
  sources: CollectionType<{ value: string }>
  appraisalNotes: CollectionType<{ value: string }>
  collectionHistories: CollectionType<{ value: string }>
  originalsHeldBy: CollectionType<{ value: string }>
  rights: CollectionType<{ value: string }>
  notes: CollectionType<{ value: string }>
  inscriptions: CollectionType<{ value: string }>
  summaries: CollectionType<{ value: string }>
  publishedInfo: CollectionType<{ value: string }>
  numericalData: CollectionType<{ value: string }>
  exhibitions: CollectionType<RelationshipType>
  links: CollectionType<RelationshipType>
  locations: CollectionType<RelationshipType>
  parentItem: ParentItemType
  groupItemId: ParentItemType
  partOfItemId: ParentItemType
  formatGroups: CollectionType<{ enumId: string; title: string }>
  files: CollectionType<FileSummary>
  documents?: CollectionType<DocumentType>
  itemType?: string
  isFullTextAvailable?: boolean
  hierarchyPosition?: string
  hierarchyLevel?: string
  holdings?: CollectionType<{ id: string; callNumber: string }>
  copyright?: CollectionType<RelationshipType>
}

export const FormatGroupsType = {
  audio: {
    title: 'Audio',
    id: ['NvvRDeqKwkpxo'],
    children: [
      'musicalRecordings',
      'nonMusicalRecordings',
      'audiobooks',
      'oralHistory'
    ]
  },
  books: {
    title: 'Books',
    id: ['rk34lv59oyl8q'],
    children: ['books', 'ebooks']
  },
  eresources: {
    title: 'Eresources',
    id: ['qjD3Axq1q7NXG'],
    children: ['websites', 'databases', 'software']
  },
  journalsMagazines: {
    title: 'Journals & Magazines',
    id: ['bR2NK49BNJ3Jy'],
    children: ['journals']
  },
  manuscripts: {
    title: 'Manuscripts',
    id: ['bR2NK49BNJ3Jy'],
    children: ['manuscripts']
  },
  maps: {
    title: 'Maps',
    id: ['1d1M8NdvgqxAY'],
    children: ['maps', 'manuscriptMaps']
  },
  music: {
    title: 'Music',
    id: ['JwMj8Y50jG3e5'],
    children: [
      'musicalRecordings',
      'manuscriptMusicScores',
      'printedMusicScores',
      'manuscriptNotatedMusic'
    ]
  },
  newspapers: {
    title: 'Newspapers',
    id: ['R5m2rqY0qb0Og'],
    children: ['newspapers', 'clippingArchival']
  },
  objects: {
    title: 'Objects',
    id: ['mp593lA2MErpk'],
    children: ['objects', 'stamps', 'ephemera', 'medals', 'coins']
  },
  pictures: {
    title: 'Pictures',
    id: ['aBGl8O6YeJakO'],
    children: [
      'pictures',
      'prints',
      'drawings',
      'paintings',
      'posters',
      'archTechDrawings',
      'photographs',
      'designDrawings'
    ]
  },
  videoFilms: {
    title: 'Video & Films',
    id: ['E62DyPYymyMj6'],
    children: ['video', 'films']
  }
}
export const FormatType = {
  pictures: { title: 'Pictures', id: 'J19GWyDjZ8Ny7' },
  prints: { title: 'Prints', id: 'vpkdDA18BDOdR' },
  journals: { title: 'Journals', id: 'Z5AB0OkPYjPb9' },
  manuscripts: { title: 'Manuscripts', id: '330MWgKgY5adZ' },
  manuscriptNotatedMusic: {
    title: 'Manuscript Notated Music',
    id: 'oWWJDK5PO44me'
  },
  drawings: { title: 'Drawings', id: 'GP85pXKPWzzB' },
  paintings: { title: 'Paintings', id: '0GB866Xe6mz1q' },
  posters: { title: 'Posters', id: 'b10aqZK7gRzJy' },
  medals: { title: 'Medals', id: 'X8gBJlg9E1WqK' },
  photographs: { title: 'Photographs', id: 'wKK2B5BO3aEYa' },
  archTechDrawings: {
    title: 'Architectural & Technical drawings',
    id: 'm6zK940qx9v7K'
  },
  designDrawings: { title: 'Design drawings', id: 'adx22BvP5OZzd' },
  musicalRecordings: { title: 'Musical Sound Recordings', id: 'KOpMgA2JjBYmO' },
  nonMusicalRecordings: {
    title: 'Non-Musical Sound Recordings',
    id: 'z02KkaA8xXx4E'
  },
  audiobooks: { title: 'Audiobooks', id: 'eYKpN0w38X70M' },
  oralHistory: { title: 'Oral History', id: 'rozeqoxvmZd7Y' },
  video: { title: 'Video', id: 'NWOD2N4edDPzO' },
  films: { title: 'Film', id: 'aXgRM15jrzBWz' },
  manuscriptMusicScores: {
    title: 'Manuscript Music Scores',
    id: '9DDK52Ye2G2AD'
  },
  printedMusicScores: { title: 'Printed Music Scores', id: 'pdvZx08jwjzW3' },
  maps: { title: 'Maps', id: '40XObXd7aA4a' },
  manuscriptMaps: { title: 'Manuscript Maps', id: 'Xp1qba0O2k32v' },
  books: { title: 'Books', id: 'NZZpwp2868p5M' },
  ebooks: { title: 'eBooks', id: 'N3pJ526GkY1eO' },
  newspapers: { title: 'Newspapers', id: 'AommGlpkXZXZw' },
  clippingArchival: {
    title: 'Clipping in Archival collections',
    id: 'NZGo2YmOzodMN'
  },
  websites: { title: 'Websites', id: 'YRYOvb5lG73e5' },
  databases: { title: 'Databases', id: '0oJjB4MK5PxJ1' },
  software: { title: 'Software', id: 'xjDp7A8zKb6dk' },
  objects: { title: 'Objects', id: '7MZAw5gxmyyaW' },
  stamps: { title: 'Stamps', id: 'BRg6jXK4mz4wG' },
  ephemera: { title: 'Ephemera', id: 'vz2D0Am8wvrlb' },
  coins: { title: 'Coins', id: '76pM49Z2jxBzR' }
}

export const ItemType = {
  book: { type: 'book', value: 'Books', name: 'books' },
  manuscript: { type: 'manuscript', value: 'Manuscripts', name: 'manuscripts' },
  letter: { type: 'letter', value: 'Letters', name: 'letter' },
  cartographic: {
    type: 'cartographic',
    value: 'Cartographic',
    name: 'cartographic'
  },
  unknown: { type: 'unknown', value: 'Unknown', name: 'unknown' }
}
export const FacetDictionary = {
  accesses: {
    name: 'accesses',
    type: 'accesses',
    esType: 'accesses_agg'
  },
  subjectIds: {
    name: 'subject',
    type: 'subject',
    esType: 'subject_agg'
  },
  subject: {
    name: 'subject',
    query: 'subject_id',
    type: 'subjects',
    esType: 'subject_agg'
  },
  language: {
    name: 'language',
    query: 'language_id',
    type: 'languages',
    esType: 'language_agg'
  },
  location: {
    name: 'location',
    query: 'location_id',
    type: 'locations',
    esType: 'location_agg'
  },
  format: {
    name: 'format',
    type: 'formats',
    query: 'format_id',
    esType: false
  },
  formatGroup: {
    name: 'format',
    type: 'formats',
    query: 'format_id',
    esType: false
  },
  author: {
    name: 'author',
    type: 'authors',
    query: 'author_id',
    esType: 'author_agg'
  }
}
