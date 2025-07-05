import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { logger } from '@/utils/logger';

interface ChromaConfig {
  host: string;
  port: number;
  ssl: boolean;
}

interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  distance: number;
}

export class ChromaService {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private readonly COLLECTION_NAME = 'openclass_documents';
  private embeddings: OpenAIEmbeddings;

  constructor(config: ChromaConfig) {
    this.client = new ChromaClient({
      path: `${config.ssl ? 'https' : 'http'}://${config.host}:${config.port}`
    });
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });
  }

  async initialize(): Promise<void> {
    try {
      // 기존 컬렉션 확인
      const collections = await this.client.listCollections();
      const existingCollection = collections.find((c: any) => c.name === this.COLLECTION_NAME);
      
      if (existingCollection) {
        this.collection = await this.client.getCollection({
          name: this.COLLECTION_NAME
        });
        logger.info('기존 Chroma 컬렉션을 로드했습니다.');
      } else {
        // 새 컬렉션 생성
        this.collection = await this.client.createCollection({
          name: this.COLLECTION_NAME,
          metadata: {
            description: 'OpenClass 학습 플랫폼 문서 컬렉션'
          }
        });
        logger.info('새 Chroma 컬렉션을 생성했습니다.');
      }
    } catch (error) {
      logger.error('Chroma 초기화 오류:', error);
      throw new Error('Chroma 서비스 초기화에 실패했습니다.');
    }
  }

  async addDocument(
    content: string,
    metadata: Record<string, any>,
    documentId?: string
  ): Promise<string> {
    if (!this.collection) {
      throw new Error('Chroma 컬렉션이 초기화되지 않았습니다.');
    }

    try {
      // 텍스트 분할
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      });

      const documents = await splitter.createDocuments([content], [metadata]);
      
      // 임베딩 생성
      const embeddings = await this.embeddings.embedDocuments(
        documents.map(doc => doc.pageContent)
      );

      // Chroma에 추가
      const ids = documentId ? [documentId] : [crypto.randomUUID()];
      
      await this.collection.add({
        ids,
        embeddings: [embeddings[0]],
        documents: [documents[0].pageContent],
        metadatas: [documents[0].metadata]
      });

      logger.info('문서가 Chroma에 추가되었습니다.', { documentId: ids[0] });
      return ids[0];
    } catch (error) {
      logger.error('문서 추가 오류:', error);
      throw new Error('문서 추가에 실패했습니다.');
    }
  }

  async search(
    query: string,
    limit: number = 5,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error('Chroma 컬렉션이 초기화되지 않았습니다.');
    }

    try {
      // 쿼리 임베딩 생성
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // 검색 실행
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: filter
      });

      // 결과 변환
      const searchResults: SearchResult[] = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          searchResults.push({
            id: results.ids[0][i],
            content: results.documents?.[0]?.[i] || '',
            metadata: results.metadatas?.[0]?.[i] || {},
            distance: results.distances?.[0]?.[i] || 0
          });
        }
      }

      logger.info('Chroma 검색 완료', { 
        query, 
        resultCount: searchResults.length 
      });

      return searchResults;
    } catch (error) {
      logger.error('Chroma 검색 오류:', error);
      throw new Error('검색에 실패했습니다.');
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.collection) {
      throw new Error('Chroma 컬렉션이 초기화되지 않았습니다.');
    }

    try {
      await this.collection.delete({
        ids: [documentId]
      });

      logger.info('문서가 Chroma에서 삭제되었습니다.', { documentId });
    } catch (error) {
      logger.error('문서 삭제 오류:', error);
      throw new Error('문서 삭제에 실패했습니다.');
    }
  }

  async updateDocument(
    documentId: string,
    content: string,
    metadata: Record<string, any>
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('Chroma 컬렉션이 초기화되지 않았습니다.');
    }

    try {
      // 기존 문서 삭제
      await this.deleteDocument(documentId);

      // 새 문서 추가
      await this.addDocument(content, metadata, documentId);

      logger.info('문서가 Chroma에서 업데이트되었습니다.', { documentId });
    } catch (error) {
      logger.error('문서 업데이트 오류:', error);
      throw new Error('문서 업데이트에 실패했습니다.');
    }
  }

  async getCollectionStats(): Promise<{
    count: number;
    name: string;
  }> {
    if (!this.collection) {
      throw new Error('Chroma 컬렉션이 초기화되지 않았습니다.');
    }

    try {
      const count = await this.collection.count();
      
      return {
        count,
        name: this.COLLECTION_NAME
      };
    } catch (error) {
      logger.error('컬렉션 통계 조회 오류:', error);
      throw new Error('컬렉션 통계 조회에 실패했습니다.');
    }
  }

  async addDocuments(documents: Array<{
    content: string;
    metadata: Record<string, any>;
    id?: string;
  }>): Promise<string[]> {
    if (!this.collection) {
      throw new Error('Chroma 컬렉션이 초기화되지 않았습니다.');
    }

    try {
      const ids: string[] = [];
      const contents: string[] = [];
      const metadatas: Record<string, any>[] = [];

      for (const doc of documents) {
        const docId = doc.id || crypto.randomUUID();
        ids.push(docId);
        contents.push(doc.content);
        metadatas.push(doc.metadata);
      }

      // 임베딩 생성
      const embeddings = await this.embeddings.embedDocuments(contents);

      // Chroma에 추가
      await this.collection.add({
        ids,
        embeddings,
        documents: contents,
        metadatas
      });

      logger.info('여러 문서가 Chroma에 추가되었습니다.', { count: documents.length });
      return ids;
    } catch (error) {
      logger.error('문서들 추가 오류:', error);
      throw new Error('문서들 추가에 실패했습니다.');
    }
  }

  async addTextChunks(texts: string[], metadata: Record<string, any>[]): Promise<string[]> {
    if (!this.collection) {
      throw new Error('Chroma 컬렉션이 초기화되지 않았습니다.');
    }

    try {
      // 임베딩 생성
      const embeddings = await this.embeddings.embedDocuments(texts);

      // ID 생성
      const ids = texts.map(() => crypto.randomUUID());

      // Chroma에 추가
      await this.collection.add({
        ids,
        embeddings,
        documents: texts,
        metadatas: metadata
      });

      logger.info('텍스트 청크들이 Chroma에 추가되었습니다.', { count: texts.length });
      return ids;
    } catch (error) {
      logger.error('텍스트 청크 추가 오류:', error);
      throw new Error('텍스트 청크 추가에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스
export const chromaService = new ChromaService({
  host: process.env.CHROMA_HOST || 'localhost',
  port: parseInt(process.env.CHROMA_PORT || '8000'),
  ssl: process.env.CHROMA_SSL === 'true'
}); 