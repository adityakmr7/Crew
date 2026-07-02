import { Image } from "expo-image";
import { StyleSheet } from "react-native";

const BLURHASH_PLACEHOLDER = "L6Pj0^jE.AyE_3t7t7R**0o#DgR4";

interface CardImageProps {
  uri: string;
  width: number;
  height: number;
}

export function CardImage({ uri, width, height }: CardImageProps) {
  return (
    <Image
      source={{ uri, width, height }}
      style={[styles.image, { aspectRatio: width / height }]}
      placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
      placeholderContentFit="cover"
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    backgroundColor: "#1c1c1e",
  },
});
