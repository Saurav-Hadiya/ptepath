import api from '@/lib/api';
import { normalizeError } from '@/lib/api-error';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { extensionForMimeType } from '@/hooks/useSpeakingRecorder';
import {
  speakingScoreResultSchema,
  speakingQuestionSchema,
  speakingCountsSchema,
} from '@/lib/validations/speaking';
import type {
  ApiResponse,
  SpeakingCounts,
  SpeakingQuestionListItem,
  SpeakingQuestion,
  SpeakingScoreResult,
} from '@/types';

/** Builds the multipart body for an evaluate call with a filename matching the recorder's actual codec. */
function buildAudioFormData(audioBlob: Blob, questionId: string): FormData {
  const formData = new FormData();
  const extension = extensionForMimeType(audioBlob.type);
  formData.append('audio', audioBlob, `recording.${extension}`);
  formData.append('questionId', questionId);
  return formData;
}

async function postEvaluate(endpoint: string, formData: FormData): Promise<SpeakingScoreResult> {
  try {
    const { data } = await api.post<ApiResponse<unknown>>(endpoint, formData);
    return speakingScoreResultSchema.parse(data.data);
  } catch (error) {
    throw normalizeError(error);
  }
}

export const speakingService = {
  async getCounts(): Promise<SpeakingCounts> {
    try {
      const { data } = await api.get<ApiResponse<unknown>>(API_ENDPOINTS.speaking.counts);
      return speakingCountsSchema.parse(data.data);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async listByType(type: string): Promise<{ questions: SpeakingQuestionListItem[]; total: number }> {
    try {
      const { data } = await api.get<
        ApiResponse<{ questions: SpeakingQuestionListItem[]; total: number }>
      >(API_ENDPOINTS.speaking.list(type));
      return data.data as { questions: SpeakingQuestionListItem[]; total: number };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getQuestion(type: string, id: string): Promise<SpeakingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.speaking.get(type, id)
      );
      return speakingQuestionSchema.parse(data.data?.question) as SpeakingQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async getNext(type: string, id: string): Promise<SpeakingQuestion> {
    try {
      const { data } = await api.get<ApiResponse<{ question: unknown }>>(
        API_ENDPOINTS.speaking.next(type, id)
      );
      return speakingQuestionSchema.parse(data.data?.question) as SpeakingQuestion;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  async evaluateReadAloud(questionId: string, audioBlob: Blob): Promise<SpeakingScoreResult> {
    return postEvaluate(API_ENDPOINTS.speaking.evaluate.readAloud, buildAudioFormData(audioBlob, questionId));
  },

  async evaluateRepeatSentence(questionId: string, audioBlob: Blob): Promise<SpeakingScoreResult> {
    return postEvaluate(
      API_ENDPOINTS.speaking.evaluate.repeatSentence,
      buildAudioFormData(audioBlob, questionId)
    );
  },

  async evaluateDescribeImage(
    questionId: string,
    audioBlob: Blob,
    recordingDuration: number
  ): Promise<SpeakingScoreResult> {
    const formData = buildAudioFormData(audioBlob, questionId);
    formData.append('recordingDuration', String(recordingDuration));
    return postEvaluate(API_ENDPOINTS.speaking.evaluate.describeImage, formData);
  },

  async evaluateRespondSituation(
    questionId: string,
    audioBlob: Blob,
    recordingDuration: number
  ): Promise<SpeakingScoreResult> {
    const formData = buildAudioFormData(audioBlob, questionId);
    formData.append('recordingDuration', String(recordingDuration));
    return postEvaluate(API_ENDPOINTS.speaking.evaluate.respondSituation, formData);
  },

  async evaluateAnswerShort(questionId: string, audioBlob: Blob): Promise<SpeakingScoreResult> {
    return postEvaluate(API_ENDPOINTS.speaking.evaluate.answerShort, buildAudioFormData(audioBlob, questionId));
  },
};
