const STUFF = {
  archTechDrawings: {
    id: 'm6zK940qx9v7K',
    name: 'architectural drawings',
    description:
      'Drawings made for the design and construction of sites, structures, details, fixtures, furnishings, and decorations, as well as other objects designed by an architect or architectural office.'
  },
  newspapers: {
    id: '76pM49Z2jxBzR',
    name: 'newspapers',
    description: ''
  },
  coin: {
    id: '76pM49Z2jxBzR',
    name: 'coins',
    description: 'Flat discs with an official stamp used as money.'
  },
  drawings: { id: 'GP85pXKPWzzB', name: 'drawings', description: '' },
  ephemera: {
    id: 'vz2D0Am8wvrlb',
    name: 'ephemera',
    description:
      'Materials, usually printed documents, created for a specific, limited purpose, and generally designed to be discarded after use.'
  },
  journals: {
    id: 'Z5AB0OkPYjPb9',
    name: 'journals',
    description:
      'Publications issued over a period of time, such as newsletters and magazines. Often may be called yearbooks, journals, annual reports, newsletters, magazines, periodicals, gazettes and so forth'
  },
  manuscripts: {
    id: '330MWgKgY5adZ',
    name: 'manuscripts',
    description:
      'Unpublished documents and records accumulated by agencies and people, usually handwritten however can be transcript, includes documents, books, letters etc.'
  },
  manuscriptMaps: {
    id: 'Xp1qba0O2k32v',
    name: 'unpublished maps',
    description:
      'Hand drawn maps or the original drawing of a map as compiled or constructed from various data, such as ground surveys and photographs.'
  },
  manuscriptNotatedMusic: {
    id: 'oWWJDK5PO44me',
    name: 'notated music',
    description:
      'Graphic representations of musical works such as musical scores. Often the means for communicating to the performer(s) how the musical work is to be realized in sound.'
  },
  maps: {
    id: '40XObXd7aA4a',
    name: 'published maps',
    description:
      'Published graphic representations of areas of land or sea or another celestial sphere indicating the relative position of artificial and natural features according to a scale.'
  },
  medals: {
    id: 'X8gBJlg9E1WqK',
    name: 'medals',
    description:
      'Pieces of stamped metal awarded for excellence or achievement or issued to commemorate a person or event, often military decorations for conduct during conflict.'
  },
  negatives: {
    id: 'wKK2B5BO3aEYa',
    name: 'negatives',
    description:
      'Photographic images, usually on transparent film or glass, with reversed tones.',
    esQuery: {
      type: 'should',
      matchType: 'match_phrase_prefix',
      field: 'item_id_callnumber_key',
      values: ['SLIDES', 'ON']
    }
  },
  objects: {
    id: '7MZAw5gxmyyaW',
    name: 'objects',
    description:
      'Three dimensional material things that can be seen and touched, includes games, coins, weapons, hair, lockets and other artefacts.'
  },
  paintings: {
    id: '0GB866Xe6mz1q',
    name: 'paintings',
    description:
      'Pictures formed primarily by the direct application of pigment suspended in a medium, arranged in masses of colour onto a generally two-dimensional surface. The paintings in the Library’s collection are primarily documentary in nature.'
  },
  photographs: {
    id: 'wKK2B5BO3aEYa',
    name: 'photographs',
    description:
      'Pictures made using a camera, in which an image is focused on to light-sensitive material and then made visible and permanent by chemical treatment, or stored digitally.',
    esQuery: {
      type: 'must_not',
      matchType: 'match_phrase_prefix',
      field: 'item_id_callnumber_key',
      values: ['SLIDES', 'ON']
    }
  },
  pictures: {
    id: 'J19GWyDjZ8Ny7',
    name: 'pictures',
    description:
      'An image on a surface, may be formed using a variety of techniques, including drawing, painting, printing, photography.'
  },
  posters: {
    id: 'b10aqZK7gRzJy',
    name: 'posters',
    description:
      'Pictorial notices made for posting in a public place to attract attention to events, activities, causes, goods, or services or to be purely decorative.'
  },
  prints: {
    id: 'vpkdDA18BDOdR',
    name: 'prints',
    description:
      'Pictures formed by transfer of a medium from one surface to another, usually ink.'
  },
  stamps: {
    id: 'BRg6jXK4mz4wG',
    name: 'stamps',
    description:
      'Government-authorized hand stamps, adhesive stamps, or meter markings intended as evidence of payment of postage. Also, stamps issued by private mail delivery companies to denote payment of their delivery fees.'
  },
  video: {
    id: 'NWOD2N4edDPzO',
    name: 'video',
    description:
      'Audiovisual materials which are motion pictures, film, movies. Can be on a film, disc or digital physical carrier.'
  }
}

export default STUFF
